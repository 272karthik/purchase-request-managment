const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const {
        PurchaseRequests,
        PurchaseRequestItems,
        Notifications,
        StatusHistories
    } = this.entities;


    // ============================================================
    // HELPER: APPROVAL LEVEL
    // ============================================================

    function getApproverLevel(amount) {

        amount = Number(amount || 0);

        if (amount <= 10000) {
            return 'Manager';
        }

        if (amount <= 50000) {
            return 'Senior Manager';
        }

        return 'Director';
    }


    // ============================================================
    // HELPER: USER ROLE
    // ============================================================

    function getUserRole(req) {

        if (!req?.user) {
            return 'Employee';
        }

        if (req.user.is('Admin')) {
            return 'Admin';
        }

        if (req.user.is('Director')) {
            return 'Director';
        }

        if (req.user.is('SeniorManager')) {
            return 'Senior Manager';
        }

        if (req.user.is('Manager')) {
            return 'Manager';
        }

        return 'Employee';
    }


    // ============================================================
    // HELPER: CREATE NOTIFICATION
    // ============================================================

    async function createNotification(requestID, type, message) {

        await INSERT.into(Notifications).entries({
            request_ID: requestID,
            message: message,
            type: type,
            isRead: false
        });
    }


    // ============================================================
    // HELPER: CREATE STATUS HISTORY
    // ============================================================

    async function createHistory(
        requestID,
        oldStatus,
        newStatus,
        userName
    ) {

        await INSERT.into(StatusHistories).entries({

            request_ID: requestID,

            oldStatus: oldStatus,

            newStatus: newStatus,

            userName: userName || 'SYSTEM',

            changedAt: new Date()
        });
    }


    // ============================================================
    // HELPER: CALCULATE ITEM + PR TOTAL
    // ============================================================

    async function recalculatePurchaseRequest(requestID) {

        const items = await SELECT
            .from(PurchaseRequestItems)
            .where({
                request_ID: requestID
            });


        let totalAmount = 0;


        for (const item of items) {

            const quantity =
                Number(item.quantity || 0);

            const unitPrice =
                Number(item.unitPrice || 0);


            const totalPrice =
                quantity * unitPrice;


            const taxAmount =
                totalPrice * 0.18;


            const grossAmount =
                totalPrice + taxAmount;


            await UPDATE(PurchaseRequestItems)
                .set({

                    totalPrice:
                        Number(totalPrice.toFixed(2)),

                    taxAmount:
                        Number(taxAmount.toFixed(2)),

                    grossAmount:
                        Number(grossAmount.toFixed(2))
                })
                .where({
                    ID: item.ID
                });


            totalAmount += grossAmount;
        }


        totalAmount =
            Number(totalAmount.toFixed(2));


        const approver =
            getApproverLevel(totalAmount);


        await UPDATE(PurchaseRequests)
            .set({

                totalAmount: totalAmount,

                approver: approver
            })
            .where({
                ID: requestID
            });


        return {
            totalAmount,
            approver,
            itemCount: items.length
        };
    }


    // ============================================================
    // RULE 9
    // REQUEST NUMBER GENERATION
    // ============================================================

    this.before(
        'CREATE',
        PurchaseRequests,
        async (req) => {

            const year =
                new Date().getFullYear();


            const existing =
                await SELECT
                    .from(PurchaseRequests);


            let maxNumber = 0;


            for (const request of existing) {

                if (!request.requestNo) {
                    continue;
                }


                const parts =
                    request.requestNo.split('-');


                if (
                    parts.length === 3 &&
                    Number(parts[1]) === year &&
                    !isNaN(Number(parts[2]))
                ) {

                    maxNumber =
                        Math.max(
                            maxNumber,
                            Number(parts[2])
                        );
                }
            }


            const nextNumber =
                maxNumber + 1;


            req.data.requestNo =
                `PR-${year}-${String(nextNumber).padStart(6, '0')}`;


            req.data.status = 'Draft';
        }
    );


    // ============================================================
    // HEADER VALIDATION
    //
    // IMPORTANT:
    // Do NOT require items here.
    // Fiori draft header and items are persisted separately.
    // ============================================================

    this.before(
        ['CREATE', 'UPDATE'],
        PurchaseRequests,
        async (req) => {


            // ========================================================
            // RULE 12: DEPARTMENT VALIDATION
            // ========================================================

            const validDepartments = [
                'Finance',
                'HR',
                'Procurement',
                'IT',
                'Manufacturing'
            ];


            if (
                req.data.department &&
                !validDepartments.includes(
                    req.data.department
                )
            ) {

                return req.error(
                    400,
                    'Invalid Department. Allowed values: Finance, HR, Procurement, IT, Manufacturing.'
                );
            }


            // ========================================================
            // RULE 22: DATE VALIDATION
            // ========================================================

            if (req.data.requestDate) {

                const requestDate =
                    new Date(req.data.requestDate);


                const today =
                    new Date();


                requestDate.setHours(
                    0, 0, 0, 0
                );

                today.setHours(
                    0, 0, 0, 0
                );


                if (requestDate > today) {

                    return req.error(
                        400,
                        'Request Date cannot be a future date.'
                    );
                }


                const difference =
                    (
                        today - requestDate
                    ) /
                    (1000 * 60 * 60 * 24);


                if (difference > 30) {

                    return req.error(
                        400,
                        'Request Date cannot be more than 30 days old.'
                    );
                }
            }


            // ========================================================
            // RULE 8 + RULE 21
            // ONLY DRAFT CAN BE EDITED
            // ========================================================

            if (req.data.ID) {

                const existing =
                    await SELECT.one
                        .from(PurchaseRequests)
                        .where({
                            ID: req.data.ID
                        });


                if (existing) {

                    if (
                        [
                            'Approved',
                            'Rejected',
                            'Cancelled',
                            'Expired'
                        ].includes(
                            existing.status
                        )
                    ) {

                        return req.error(
                            400,
                            `Purchase Request is ${existing.status} and cannot be modified.`
                        );
                    }


                    if (
                        req.event === 'UPDATE' &&
                        existing.status !== 'Draft'
                    ) {

                        return req.error(
                            400,
                            'Only Draft Purchase Requests can be edited.'
                        );
                    }
                }
            }
        }
    );


    // ============================================================
    // ITEM CREATE VALIDATION
    // ============================================================

    this.before(
        'CREATE',
        PurchaseRequestItems,
        async (req) => {

            const requestID =
                req.data.request_ID;


            if (!requestID) {
                return;
            }


            const request =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: requestID
                    });


            if (!request) {

                return req.error(
                    404,
                    'Purchase Request not found.'
                );
            }


            // Only Draft requests can receive items

            if (request.status !== 'Draft') {

                return req.error(
                    400,
                    'Items can only be added to Draft Purchase Requests.'
                );
            }


            // ========================================================
            // RULE 10: MAXIMUM 20 ITEMS
            // ========================================================

            const existingItems =
                await SELECT
                    .from(PurchaseRequestItems)
                    .where({
                        request_ID: requestID
                    });


            if (existingItems.length >= 20) {

                return req.error(
                    400,
                    'A Purchase Request can contain a maximum of 20 items.'
                );
            }


            // ========================================================
            // RULE 7: DUPLICATE MATERIAL NUMBER
            // ========================================================

            if (!req.data.materialNo) {

                return req.error(
                    400,
                    'Material Number is mandatory.'
                );
            }


            const duplicate =
                existingItems.find(
                    item =>
                        item.materialNo ===
                        req.data.materialNo
                );


            if (duplicate) {

                return req.error(
                    400,
                    `Duplicate Material Number '${req.data.materialNo}' is not allowed.`
                );
            }


            validateItem(req);
        }
    );


    // ============================================================
    // ITEM UPDATE VALIDATION
    // ============================================================

    this.before(
        'UPDATE',
        PurchaseRequestItems,
        async (req) => {

            const item =
                await SELECT.one
                    .from(PurchaseRequestItems)
                    .where({
                        ID: req.data.ID
                    });


            if (!item) {
                return;
            }


            const request =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: item.request_ID
                    });


            if (!request) {
                return;
            }


            if (request.status !== 'Draft') {

                return req.error(
                    400,
                    'Items can only be modified when the Purchase Request is in Draft status.'
                );
            }


            validateItem(req, item);
        }
    );


    // ============================================================
    // ITEM VALIDATION HELPER
    // ============================================================

    function validateItem(req, existingItem = {}) {

        const quantity =
            Number(
                req.data.quantity ??
                existingItem.quantity ??
                0
            );


        const unitPrice =
            Number(
                req.data.unitPrice ??
                existingItem.unitPrice ??
                0
            );


        const description =
            (
                req.data.description ??
                existingItem.description ??
                ''
            ).trim();


        // RULE 2

        if (quantity <= 0) {

            req.error(
                400,
                'Quantity should always be greater than zero.'
            );
        }


        // RULE 14

        if (quantity > 100) {

            req.error(
                400,
                'Quantity cannot exceed 100.'
            );
        }


        // RULE 3 + 15

        if (unitPrice <= 0) {

            req.error(
                400,
                'Unit Price should always be greater than zero.'
            );
        }


        if (unitPrice >= 100000) {

            req.error(
                400,
                'Unit Price should be less than ₹100000.'
            );
        }


        // RULE 13

        if (!description) {

            req.error(
                400,
                'Material Description is mandatory.'
            );
        }


        if (description.length < 10) {

            req.error(
                400,
                'Material Description must contain at least 10 characters.'
            );
        }
    }


    // ============================================================
    // AFTER ITEM CREATE
    // RECALCULATE TOTAL
    // ============================================================

    this.after(
        'CREATE',
        PurchaseRequestItems,
        async (data, req) => {

            const requestID =
                data.request_ID;


            if (requestID) {

                await recalculatePurchaseRequest(
                    requestID
                );
            }
        }
    );


    // ============================================================
    // AFTER ITEM UPDATE
    // RECALCULATE TOTAL
    // ============================================================

    this.after(
        'UPDATE',
        PurchaseRequestItems,
        async (data, req) => {

            const item =
                await SELECT.one
                    .from(PurchaseRequestItems)
                    .where({
                        ID: data.ID
                    });


            if (item?.request_ID) {

                await recalculatePurchaseRequest(
                    item.request_ID
                );
            }
        }
    );


    // ============================================================
    // RULE 24
    // ITEM DELETE RESTRICTION
    // ============================================================

    this.before(
        'DELETE',
        PurchaseRequestItems,
        async (req) => {

            const item =
                await SELECT.one
                    .from(PurchaseRequestItems)
                    .where({
                        ID: req.data.ID
                    });


            if (!item) {
                return;
            }


            const request =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: item.request_ID
                    });


            if (
                request &&
                request.status !== 'Draft'
            ) {

                return req.error(
                    400,
                    'Items cannot be deleted after request submission.'
                );
            }
        }
    );


    // ============================================================
    // AFTER ITEM DELETE
    // RECALCULATE TOTAL
    // ============================================================

    this.after(
        'DELETE',
        PurchaseRequestItems,
        async (data, req) => {


        }
    );
    // ============================================================
    // RULE 21: PURCHASE REQUEST DELETE RESTRICTION
    // ============================================================

    this.before(
        'DELETE',
        PurchaseRequests,
        async (req) => {

            const requestID = req.data.ID;

            const purchaseRequest =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: requestID
                    });

            if (!purchaseRequest) {
                return;
            }

            if (
                [
                    'Submitted',
                    'Approved',
                    'Rejected',
                    'Cancelled',
                    'Expired'
                ].includes(purchaseRequest.status)
            ) {

                return req.error(
                    400,
                    `Purchase Request is ${purchaseRequest.status} and cannot be deleted.`
                );
            }
        }
    );


    // ============================================================
    // RULE 1, 5, 7, 16, 17, 23
    // SUBMIT REQUEST
    // ============================================================

    this.on(
        'submitRequest',
        'PurchaseRequests',
        async (req) => {

            const requestID =
                req.params[0].ID;


            // ========================================================
            // GET REQUEST
            // ========================================================

            const purchaseRequest =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: requestID
                    });


            if (!purchaseRequest) {

                return req.error(
                    404,
                    'Purchase Request not found.'
                );
            }


            // ========================================================
            // STATUS
            // ========================================================

            if (
                purchaseRequest.status !==
                'Draft'
            ) {

                return req.error(
                    400,
                    `Only Draft Purchase Requests can be submitted. Current status: ${purchaseRequest.status}`
                );
            }


            // ========================================================
            // GET ACTUAL DATABASE ITEMS
            // ========================================================

            const items =
                await SELECT
                    .from(PurchaseRequestItems)
                    .where({
                        request_ID: requestID
                    });


            // RULE 1

            if (items.length === 0) {

                return req.error(
                    400,
                    'At least one item should exist before submitting a Purchase Request.'
                );
            }


            // RULE 10

            if (items.length > 20) {

                return req.error(
                    400,
                    'A Purchase Request can contain a maximum of 20 items.'
                );
            }


            // ========================================================
            // VALIDATE + CALCULATE ACTUAL ITEMS
            // ========================================================

            const materialNumbers =
                new Set();


            let totalAmount = 0;


            for (const item of items) {

                // RULE 7

                if (
                    materialNumbers.has(
                        item.materialNo
                    )
                ) {

                    return req.error(
                        400,
                        `Duplicate Material Number '${item.materialNo}' is not allowed.`
                    );
                }


                materialNumbers.add(
                    item.materialNo
                );


                const quantity =
                    Number(item.quantity || 0);


                const unitPrice =
                    Number(item.unitPrice || 0);


                const description =
                    (
                        item.description || ''
                    ).trim();


                // RULE 2

                if (quantity <= 0) {

                    return req.error(
                        400,
                        'Quantity should always be greater than zero.'
                    );
                }


                // RULE 14

                if (quantity > 100) {

                    return req.error(
                        400,
                        'Quantity cannot exceed 100.'
                    );
                }


                // RULE 3

                if (unitPrice <= 0) {

                    return req.error(
                        400,
                        'Unit Price should always be positive.'
                    );
                }


                // RULE 15

                if (unitPrice >= 100000) {

                    return req.error(
                        400,
                        'Unit Price should be less than ₹100000.'
                    );
                }


                // RULE 13

                if (
                    !description ||
                    description.length < 10
                ) {

                    return req.error(
                        400,
                        'Material Description must contain at least 10 characters.'
                    );
                }


                // RULE 4 + 16

                const totalPrice =
                    quantity * unitPrice;


                const taxAmount =
                    totalPrice * 0.18;


                const grossAmount =
                    totalPrice + taxAmount;


                await UPDATE(PurchaseRequestItems)
                    .set({

                        totalPrice:
                            Number(
                                totalPrice.toFixed(2)
                            ),

                        taxAmount:
                            Number(
                                taxAmount.toFixed(2)
                            ),

                        grossAmount:
                            Number(
                                grossAmount.toFixed(2)
                            )
                    })
                    .where({
                        ID: item.ID
                    });


                totalAmount += grossAmount;
            }


            totalAmount =
                Number(
                    totalAmount.toFixed(2)
                );


            // RULE 23

            if (totalAmount <= 100) {

                return req.error(
                    400,
                    'Purchase Request Total Amount should be greater than ₹100.'
                );
            }


            // RULE 17

            const approver =
                getApproverLevel(
                    totalAmount
                );


            // ========================================================
            // UPDATE PR TOTAL + APPROVER
            // ========================================================

            await UPDATE(PurchaseRequests)
                .set({

                    totalAmount:
                        totalAmount,

                    approver:
                        approver
                })
                .where({
                    ID: requestID
                });


            // ========================================================
            // RULE 26: HISTORY
            // ========================================================

            await createHistory(
                requestID,
                'Draft',
                'Submitted',
                req.user?.id
            );


            // ========================================================
            // STATUS UPDATE
            // ========================================================

            await UPDATE(PurchaseRequests)
                .set({
                    status: 'Submitted'
                })
                .where({
                    ID: requestID
                });


            // ========================================================
            // RULE 25: NOTIFICATION
            // ========================================================

            await createNotification(
                requestID,
                'SUBMITTED',
                'Purchase Request Submitted'
            );


            return SELECT.one
                .from(PurchaseRequests)
                .where({
                    ID: requestID
                });
        }
    );


    // ============================================================
    // RULE 20
    // CANCEL REQUEST
    // ============================================================

    this.on(
        'cancelRequest',
        'PurchaseRequests',
        async (req) => {

            const requestID =
                req.params[0].ID;


            const purchaseRequest =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: requestID
                    });


            if (!purchaseRequest) {

                return req.error(
                    404,
                    'Purchase Request not found.'
                );
            }


            if (
                ![
                    'Draft',
                    'Submitted'
                ].includes(
                    purchaseRequest.status
                )
            ) {

                return req.error(
                    400,
                    'Only Draft and Submitted requests can be cancelled.'
                );
            }


            const oldStatus =
                purchaseRequest.status;


            await UPDATE(PurchaseRequests)
                .set({
                    status: 'Cancelled'
                })
                .where({
                    ID: requestID
                });


            await createHistory(
                requestID,
                oldStatus,
                'Cancelled',
                req.user?.id
            );


            await createNotification(
                requestID,
                'CANCELLED',
                'Purchase Request Cancelled'
            );


            return SELECT.one
                .from(PurchaseRequests)
                .where({
                    ID: requestID
                });
        }
    );


    // ============================================================
    // RULE 17 + 19 + 33
    // APPROVE REQUEST
    // ============================================================

    this.on(
        'approveRequest',
        'PurchaseRequests',
        async (req) => {

            const requestID =
                req.params[0].ID;


            const purchaseRequest =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: requestID
                    });


            if (!purchaseRequest) {

                return req.error(
                    404,
                    'Purchase Request not found.'
                );
            }


            // ========================================================
            // RULE 33
            // PREVENT SECOND APPROVAL
            // ========================================================

            if (
                purchaseRequest.status !==
                'Submitted'
            ) {

                return req.error(
                    400,
                    'Purchase Request already processed by another user.'
                );
            }


            const amount =
                Number(
                    purchaseRequest.totalAmount || 0
                );


            const role =
                getUserRole(req);


            // ========================================================
            // APPROVAL MATRIX
            // ========================================================

            if (
                amount <= 10000 &&
                ![
                    'Manager',
                    'Senior Manager',
                    'Director',
                    'Admin'
                ].includes(role)
            ) {

                return req.error(
                    403,
                    'Only Manager or higher can approve this request.'
                );
            }


            if (
                amount > 10000 &&
                amount <= 50000 &&
                ![
                    'Senior Manager',
                    'Director',
                    'Admin'
                ].includes(role)
            ) {

                return req.error(
                    403,
                    'Only Senior Manager or higher can approve this request.'
                );
            }


            if (
                amount > 50000 &&
                ![
                    'Director',
                    'Admin'
                ].includes(role)
            ) {

                return req.error(
                    403,
                    'Only Director can approve this request.'
                );
            }


            // ========================================================
            // APPROVE
            // ========================================================

            const updateResult =
                await UPDATE(PurchaseRequests)
                    .set({

                        status: 'Approved',

                        approvedBy:
                            req.user?.id,

                        approvedAt:
                            new Date()
                    })
                    .where({
                        ID: requestID,

                        status: 'Submitted'
                    });


            // ========================================================
            // CONCURRENT APPROVAL CHECK
            // ========================================================

            if (
                updateResult === 0
            ) {

                return req.error(
                    409,
                    'Purchase Request already processed by another user.'
                );
            }


            await createHistory(
                requestID,
                'Submitted',
                'Approved',
                req.user?.id
            );


            await createNotification(
                requestID,
                'APPROVED',
                'Purchase Request Approved'
            );


            return SELECT.one
                .from(PurchaseRequests)
                .where({
                    ID: requestID
                });
        }
    );


    // ============================================================
    // RULE 18
    // REJECT REQUEST
    // ============================================================

    this.on(
        'rejectRequest',
        'PurchaseRequests',
        async (req) => {

            const requestID =
                req.params[0].ID;


            const comments =
                (
                    req.data.rejectionComments ||
                    ''
                ).trim();


            // ========================================================
            // RULE 18
            // MINIMUM 20 CHARACTERS
            // ========================================================

            if (
                comments.length < 20
            ) {

                return req.error(
                    400,
                    'Rejection comments are mandatory and must contain at least 20 characters.'
                );
            }
            const role = getUserRole(req);

            if (
                ![
                    'Manager',
                    'Senior Manager',
                    'Director',
                    'Admin'
                ].includes(role)
            ) {
                return req.error(
                    403,
                    'Only Manager or higher can reject a Purchase Request.'
                );
            }


            const purchaseRequest =
                await SELECT.one
                    .from(PurchaseRequests)
                    .where({
                        ID: requestID
                    });


            if (!purchaseRequest) {

                return req.error(
                    404,
                    'Purchase Request not found.'
                );
            }


            if (
                purchaseRequest.status !==
                'Submitted'
            ) {

                return req.error(
                    400,
                    'Only Submitted requests can be rejected.'
                );
            }


            const updateResult =
                await UPDATE(PurchaseRequests)
                    .set({

                        status: 'Rejected',

                        rejectionComments:
                            comments,

                        rejectedBy:
                            req.user?.id,

                        rejectedAt:
                            new Date()
                    })
                    .where({
                        ID: requestID,

                        status: 'Submitted'
                    });


            if (
                updateResult === 0
            ) {

                return req.error(
                    409,
                    'Purchase Request already processed by another user.'
                );
            }


            await createHistory(
                requestID,
                'Submitted',
                'Rejected',
                req.user?.id
            );


            await createNotification(
                requestID,
                'REJECTED',
                'Purchase Request Rejected'
            );


            return SELECT.one
                .from(PurchaseRequests)
                .where({
                    ID: requestID
                });
        }
    );


    // ============================================================
    // RULE 28
    // EXPIRE OLD DRAFTS
    // ============================================================

    async function expireDrafts() {

        const expiryDate =
            new Date();


        expiryDate.setDate(
            expiryDate.getDate() - 30
        );


        const drafts =
            await SELECT
                .from(PurchaseRequests)
                .where({
                    status: 'Draft'
                });


        for (const request of drafts) {

            if (
                request.createdAt &&
                new Date(request.createdAt) <
                expiryDate
            ) {

                await UPDATE(PurchaseRequests)
                    .set({
                        status: 'Expired'
                    })
                    .where({
                        ID: request.ID
                    });


                await createHistory(
                    request.ID,
                    'Draft',
                    'Expired',
                    'SYSTEM'
                );


                await createNotification(
                    request.ID,
                    'EXPIRED',
                    'Purchase Request Expired'
                );
            }
        }
    }


    // Run expiry check whenever requests are read.
    // This avoids requiring a separate custom action.
    this.before(
        'READ',
        PurchaseRequests,
        async () => {

            await expireDrafts();
        }
    );


    // ============================================================
    // UI VIRTUAL FIELD HANDLING
    // ============================================================

    this.after(
        'READ',
        PurchaseRequests,
        async (data) => {

            const rows =
                Array.isArray(data)
                    ? data
                    : [data];


            for (const row of rows) {

                if (!row) {
                    continue;
                }


                row.hideSubmit =
                    row.status !== 'Draft';


                row.hideApprove =
                    row.status !== 'Submitted';


                row.hideReject =
                    row.status !== 'Submitted';


                row.canCancel =
                    row.status === 'Draft' ||
                    row.status === 'Submitted';
            }
        }
    );

});