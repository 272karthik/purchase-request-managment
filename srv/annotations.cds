using { purchaseRequestService as service } from './purchase_service';


// ============================================================
// PURCHASE REQUEST - HEADER INFORMATION
// ============================================================

annotate service.PurchaseRequests with @(
    UI.HeaderInfo: {
        TypeName: 'Purchase Request',
        TypeNamePlural: 'Purchase Requests',

        Title: {
            $Type: 'UI.DataField',
            Value: requestNo
        },

        Description: {
            $Type: 'UI.DataField',
            Value: requesterName
        }
    },


    // ========================================================
    // LIST REPORT - SEARCH / FILTER FIELDS
    // ========================================================

    UI.SelectionFields: [
        requestNo,
        requesterName,
        department,
        requestDate,
        currency,
        totalAmount,
        status,
        approver
    ],


    // ========================================================
    // LIST REPORT - TABLE
    // ========================================================

    UI.LineItem: [

        {
            $Type: 'UI.DataField',
            Value: requestNo,
            Label: 'Request Number'
        },

        {
            $Type: 'UI.DataField',
            Value: requesterName,
            Label: 'Requester Name'
        },

        {
            $Type: 'UI.DataField',
            Value: department,
            Label: 'Department'
        },

        {
            $Type: 'UI.DataField',
            Value: requestDate,
            Label: 'Request Date'
        },

        {
            $Type: 'UI.DataField',
            Value: currency,
            Label: 'Currency'
        },

        {
            $Type: 'UI.DataField',
            Value: totalAmount,
            Label: 'Total Amount'
        },

        {
            $Type: 'UI.DataField',
            Value: status,
            Label: 'Status'
        },

        {
            $Type: 'UI.DataField',
            Value: approver,
            Label: 'Approver'
        }
    ],


    // ========================================================
    // GENERAL INFORMATION
    // ========================================================

    UI.FieldGroup #General: {
        $Type: 'UI.FieldGroupType',

        Data: [

            {
                $Type: 'UI.DataField',
                Value: requestNo,
                Label: 'Request Number'
            },

            {
                $Type: 'UI.DataField',
                Value: requesterName,
                Label: 'Requester Name'
            },

            {
                $Type: 'UI.DataField',
                Value: department,
                Label: 'Department'
            },

            {
                $Type: 'UI.DataField',
                Value: requestDate,
                Label: 'Request Date'
            },

            {
                $Type: 'UI.DataField',
                Value: currency,
                Label: 'Currency'
            },

            {
                $Type: 'UI.DataField',
                Value: totalAmount,
                Label: 'Total Amount'
            },

            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            },

            {
                $Type: 'UI.DataField',
                Value: approver,
                Label: 'Approver'
            }
        ]
    },


    // ========================================================
    // APPROVAL INFORMATION
    // ========================================================

    UI.FieldGroup #Approval: {
        $Type: 'UI.FieldGroupType',

        Data: [

            {
                $Type: 'UI.DataField',
                Value: approver,
                Label: 'Approver'
            },

            {
                $Type: 'UI.DataField',
                Value: approvalComments,
                Label: 'Approval Comments'
            },

            {
                $Type: 'UI.DataField',
                Value: approvedBy,
                Label: 'Approved By'
            },

            {
                $Type: 'UI.DataField',
                Value: approvedAt,
                Label: 'Approved At'
            },

            {
                $Type: 'UI.DataField',
                Value: rejectionComments,
                Label: 'Rejection Comments'
            },

            {
                $Type: 'UI.DataField',
                Value: rejectedBy,
                Label: 'Rejected By'
            },

            {
                $Type: 'UI.DataField',
                Value: rejectedAt,
                Label: 'Rejected At'
            }
        ]
    },


    // ========================================================
    // AUDIT INFORMATION
    // ========================================================

    UI.FieldGroup #Audit: {
        $Type: 'UI.FieldGroupType',

        Data: [

            {
                $Type: 'UI.DataField',
                Value: createdBy,
                Label: 'Created By'
            },

            {
                $Type: 'UI.DataField',
                Value: createdAt,
                Label: 'Created At'
            },

            {
                $Type: 'UI.DataField',
                Value: modifiedBy,
                Label: 'Modified By'
            },

            {
                $Type: 'UI.DataField',
                Value: modifiedAt,
                Label: 'Modified At'
            },

            {
                $Type: 'UI.DataField',
                Value: approvedBy,
                Label: 'Approved By'
            },

            {
                $Type: 'UI.DataField',
                Value: approvedAt,
                Label: 'Approved At'
            },

            {
                $Type: 'UI.DataField',
                Value: rejectedBy,
                Label: 'Rejected By'
            },

            {
                $Type: 'UI.DataField',
                Value: rejectedAt,
                Label: 'Rejected At'
            }
        ]
    },


    // ========================================================
    // IDENTIFICATION - ACTION BUTTONS
    // ========================================================

    UI.Identification: [

        {
            $Type: 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.submitRequest',
            Label: 'Submit'
        },

        {
            $Type: 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.cancelRequest',
            Label: 'Cancel'
        },

        {
            $Type: 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.approveRequest',
            Label: 'Approve'
        },

        {
            $Type: 'UI.DataFieldForAction',
            Action: 'purchaseRequestService.rejectRequest',
            Label: 'Reject'
        }
    ],


    // ========================================================
    // OBJECT PAGE FACETS
    // ========================================================

    UI.Facets: [

        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Header Details',
            Target: '@UI.FieldGroup#General'
        },

        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Purchase Request Items',
            Target: 'items/@UI.LineItem'
        },

        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Approval Information',
            Target: '@UI.FieldGroup#Approval'
        },

        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Audit Information',
            Target: '@UI.FieldGroup#Audit'
        },

        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Notifications',
            Target: 'notifications/@UI.LineItem'
        },

        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Status History',
            Target: 'history/@UI.LineItem'
        }
    ]
);


// ============================================================
// PURCHASE REQUEST - FIELD CONTROL
// ============================================================

annotate service.PurchaseRequests with {

    // Automatically generated
    requestNo @Common.FieldControl: #ReadOnly;

    // Automatically calculated
    totalAmount @Common.FieldControl: #ReadOnly;

    // Controlled by actions
    status @Common.FieldControl: #ReadOnly;

    // Automatically assigned
    approver @Common.FieldControl: #ReadOnly;

    // CAP managed fields
    createdBy @Common.FieldControl: #ReadOnly;
    createdAt @Common.FieldControl: #ReadOnly;
    modifiedBy @Common.FieldControl: #ReadOnly;
    modifiedAt @Common.FieldControl: #ReadOnly;

    // Approval / rejection information
    approvedBy @Common.FieldControl: #ReadOnly;
    approvedAt @Common.FieldControl: #ReadOnly;

    rejectedBy @Common.FieldControl: #ReadOnly;
    rejectedAt @Common.FieldControl: #ReadOnly;

    // Requester can enter these
    requesterName @Common.FieldControl: #Editable;
    department @Common.FieldControl: #Editable;
    requestDate @Common.FieldControl: #Editable;
    currency @Common.FieldControl: #Editable;

    // Comments can be maintained through actions / handlers
    approvalComments @Common.FieldControl: #Editable;
    rejectionComments @Common.FieldControl: #ReadOnly;
};


// ============================================================
// DEPARTMENT VALUE HELP
// ============================================================

annotate service.PurchaseRequests with {

    department @Common.ValueList: {
        $Type: 'Common.ValueListType',

        CollectionPath: 'Departments',

        Parameters: [

            {
                $Type: 'Common.ValueListParameterInOut',

                LocalDataProperty: department,

                ValueListProperty: 'departmentId'
            },

            {
                $Type: 'Common.ValueListParameterDisplayOnly',

                ValueListProperty: 'departmentName'
            }
        ]
    };
};


// ============================================================
// CURRENCY VALUE HELP
// ============================================================

annotate service.PurchaseRequests with {

    currency @Common.ValueList: {
        $Type: 'Common.ValueListType',

        CollectionPath: 'Currencies',

        Parameters: [

            {
                $Type: 'Common.ValueListParameterInOut',

                LocalDataProperty: currency,

                ValueListProperty: 'currencyCode'
            },

            {
                $Type: 'Common.ValueListParameterDisplayOnly',

                ValueListProperty: 'currencyName'
            }
        ]
    };
};


// ============================================================
// PURCHASE REQUEST ITEMS
// ============================================================

annotate service.PurchaseRequestItems with @(
    UI.LineItem: [

        {
            $Type: 'UI.DataField',
            Value: materialNo,
            Label: 'Material Number'
        },

        {
            $Type: 'UI.DataField',
            Value: description,
            Label: 'Description'
        },

        {
            $Type: 'UI.DataField',
            Value: quantity,
            Label: 'Quantity'
        },

        {
            $Type: 'UI.DataField',
            Value: unitPrice,
            Label: 'Unit Price'
        },

        {
            $Type: 'UI.DataField',
            Value: totalPrice,
            Label: 'Net Amount'
        },

        {
            $Type: 'UI.DataField',
            Value: taxAmount,
            Label: 'GST (18%)'
        },

        {
            $Type: 'UI.DataField',
            Value: grossAmount,
            Label: 'Gross Amount'
        }
    ]
);


// ============================================================
// PURCHASE REQUEST ITEM - FIELD CONTROL
// ============================================================

annotate service.PurchaseRequestItems with {

    materialNo @Common.FieldControl: #Editable;

    description @Common.FieldControl: #Editable;

    quantity @Common.FieldControl: #Editable;

    unitPrice @Common.FieldControl: #Editable;

    // Automatically calculated
    totalPrice @Common.FieldControl: #ReadOnly;

    taxAmount @Common.FieldControl: #ReadOnly;

    grossAmount @Common.FieldControl: #ReadOnly;
};


// ============================================================
// PURCHASE REQUEST ITEM DETAILS
// ============================================================

annotate service.PurchaseRequestItems with @(
    UI.Facets: [

        {
            $Type: 'UI.ReferenceFacet',

            Label: 'Item Details',

            Target: '@UI.FieldGroup#ItemDetails'
        }
    ]
);


annotate service.PurchaseRequestItems with @(
    UI.FieldGroup #ItemDetails: {

        $Type: 'UI.FieldGroupType',

        Data: [

            {
                $Type: 'UI.DataField',
                Value: materialNo,
                Label: 'Material Number'
            },

            {
                $Type: 'UI.DataField',
                Value: description,
                Label: 'Description'
            },

            {
                $Type: 'UI.DataField',
                Value: quantity,
                Label: 'Quantity'
            },

            {
                $Type: 'UI.DataField',
                Value: unitPrice,
                Label: 'Unit Price'
            },

            {
                $Type: 'UI.DataField',
                Value: totalPrice,
                Label: 'Net Amount'
            },

            {
                $Type: 'UI.DataField',
                Value: taxAmount,
                Label: 'GST (18%)'
            },

            {
                $Type: 'UI.DataField',
                Value: grossAmount,
                Label: 'Gross Amount'
            }
        ]
    }
);


// ============================================================
// NOTIFICATIONS
// ============================================================

annotate service.Notifications with @(
    UI.LineItem: [

        {
            $Type: 'UI.DataField',
            Value: message,
            Label: 'Message'
        },

        {
            $Type: 'UI.DataField',
            Value: type,
            Label: 'Type'
        },

        {
            $Type: 'UI.DataField',
            Value: isRead,
            Label: 'Read'
        },

        {
            $Type: 'UI.DataField',
            Value: createdAt,
            Label: 'Created At'
        },

        {
            $Type: 'UI.DataField',
            Value: createdBy,
            Label: 'Created By'
        }
    ]
);


// ============================================================
// NOTIFICATION DETAILS
// ============================================================

annotate service.Notifications with @(
    UI.Facets: [

        {
            $Type: 'UI.ReferenceFacet',

            Label: 'Notification Details',

            Target: '@UI.FieldGroup#NotificationDetails'
        }
    ]
);


annotate service.Notifications with @(
    UI.FieldGroup #NotificationDetails: {

        $Type: 'UI.FieldGroupType',

        Data: [

            {
                $Type: 'UI.DataField',
                Value: message,
                Label: 'Message'
            },

            {
                $Type: 'UI.DataField',
                Value: type,
                Label: 'Type'
            },

            {
                $Type: 'UI.DataField',
                Value: isRead,
                Label: 'Read'
            },

            {
                $Type: 'UI.DataField',
                Value: createdAt,
                Label: 'Created At'
            },

            {
                $Type: 'UI.DataField',
                Value: createdBy,
                Label: 'Created By'
            }
        ]
    }
);


// ============================================================
// STATUS HISTORY
// ============================================================

annotate service.StatusHistories with @(
    UI.LineItem: [

        {
            $Type: 'UI.DataField',
            Value: oldStatus,
            Label: 'Old Status'
        },

        {
            $Type: 'UI.DataField',
            Value: newStatus,
            Label: 'New Status'
        },

        {
            $Type: 'UI.DataField',
            Value: userName,
            Label: 'Changed By'
        },

        {
            $Type: 'UI.DataField',
            Value: changedAt,
            Label: 'Changed At'
        }
    ]
);


// ============================================================
// STATUS HISTORY DETAILS
// ============================================================

annotate service.StatusHistories with @(
    UI.Facets: [

        {
            $Type: 'UI.ReferenceFacet',

            Label: 'Status Change Details',

            Target: '@UI.FieldGroup#HistoryDetails'
        }
    ]
);


annotate service.StatusHistories with @(
    UI.FieldGroup #HistoryDetails: {

        $Type: 'UI.FieldGroupType',

        Data: [

            {
                $Type: 'UI.DataField',
                Value: oldStatus,
                Label: 'Previous Status'
            },

            {
                $Type: 'UI.DataField',
                Value: newStatus,
                Label: 'New Status'
            },

            {
                $Type: 'UI.DataField',
                Value: userName,
                Label: 'Changed By'
            },

            {
                $Type: 'UI.DataField',
                Value: changedAt,
                Label: 'Changed At'
            }
        ]
    }
);


// ============================================================
// DEPARTMENTS
// ============================================================

annotate service.Departments with @(
    UI.HeaderInfo: {
        TypeName: 'Department',
        TypeNamePlural: 'Departments',

        Title: {
            Value: departmentId
        },

        Description: {
            Value: departmentName
        }
    },

    UI.LineItem: [

        {
            $Type: 'UI.DataField',
            Value: departmentId,
            Label: 'Department ID'
        },

        {
            $Type: 'UI.DataField',
            Value: departmentName,
            Label: 'Department Name'
        }
    ]
);


// ============================================================
// CURRENCIES
// ============================================================

annotate service.Currencies with @(
    UI.HeaderInfo: {
        TypeName: 'Currency',
        TypeNamePlural: 'Currencies',

        Title: {
            Value: currencyCode
        },

        Description: {
            Value: currencyName
        }
    },

    UI.LineItem: [

        {
            $Type: 'UI.DataField',
            Value: currencyCode,
            Label: 'Currency Code'
        },

        {
            $Type: 'UI.DataField',
            Value: currencyName,
            Label: 'Currency Name'
        }
    ]
);


// ============================================================
// COMMON FIELD LABELS
// ============================================================

annotate service.PurchaseRequests with {

    requestNo @Common.Label: 'Request Number';

    requesterName @Common.Label: 'Requester Name';

    department @Common.Label: 'Department';

    requestDate @Common.Label: 'Request Date';

    currency @Common.Label: 'Currency';

    totalAmount @Common.Label: 'Total Amount';

    status @Common.Label: 'Status';

    approver @Common.Label: 'Approver';

    approvalComments @Common.Label: 'Approval Comments';

    rejectionComments @Common.Label: 'Rejection Comments';

    approvedBy @Common.Label: 'Approved By';

    approvedAt @Common.Label: 'Approved At';

    rejectedBy @Common.Label: 'Rejected By';

    rejectedAt @Common.Label: 'Rejected At';

    createdBy @Common.Label: 'Created By';

    createdAt @Common.Label: 'Created At';

    modifiedBy @Common.Label: 'Modified By';

    modifiedAt @Common.Label: 'Modified At';
};


annotate service.PurchaseRequestItems with {

    materialNo @Common.Label: 'Material Number';

    description @Common.Label: 'Description';

    quantity @Common.Label: 'Quantity';

    unitPrice @Common.Label: 'Unit Price';

    totalPrice @Common.Label: 'Net Amount';

    taxAmount @Common.Label: 'GST (18%)';

    grossAmount @Common.Label: 'Gross Amount';
};


// // ============================================================
// // ACTION LABELS
// // ============================================================

// annotate service.PurchaseRequests with {

//     @UI.DataFieldForAction: {
//         Action: 'purchaseRequestService.submitRequest',
//         Label: 'Submit'
//     };

// };