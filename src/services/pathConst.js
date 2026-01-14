// BASE URL
export const baseURL = process.env.NEXT_PUBLIC_BASE_URL

// POST URL

export const loginWithOtp = `${baseURL}admin/login`
export const loginVerifyOtp = `${baseURL}otp/verify-login`
export const userProfileUrl = `${baseURL}admin/profile`

export const userListUrl = `${baseURL}admin/user-list`

export const assignFunctionList = `${baseURL}assign-task/function-list`
export const assignFunctionContactList = `${baseURL}assign-task/function-contact-list`
export const assignFunctionFilterByEvent= `${baseURL}assign-task/filter-by-events`
export const assignCallersByFunctionId= `${baseURL}assign-task/assign-callers`
export const assignCallersBulkByFunctionId= `${baseURL}assign-task/assign-callers-bulk`
export const assignedCallersList= `${baseURL}assign-task/function-assigned-caller-list`
export const assignedcallhistoryList= `${baseURL}assign-task/callhistory`
export const assignedcallhistoryExcelList= `${baseURL}assign-task/callhistory-excel`
export const reportUserList = `${baseURL}function-reports/user-list`
export const reportFunctionListByUser = `${baseURL}function-reports/function-list`
export const reportFunctionDetailsById = `${baseURL}function-reports/function-detail`
export const reportEventDetailsById = `${baseURL}function-reports/event-detail`









export const assignedFunctionList = `${baseURL}assign-task/assigned-function-list`
export const getTemplateInputList = `${baseURL}call-management/get-template`
export const postTemplateInputList = `${baseURL}call-management/create-template`
export const patchTemplateInputList = `${baseURL}call-management/update-template`
export const deleteTemplateInputList = `${baseURL}call-management/delete-template`
export const getContactListCallers = `${baseURL}call-management/get-contact-list`
export const getTemplatesDropDownCallers = `${baseURL}call-management/getTemplateDropList`
export const getTemplatesByIdCallers = `${baseURL}call-management/getTemplateDropListById`
export const triggerWACallers = `${baseURL}call-management/triggerwanotificationcaller`
export const updateWAstatusCallers = `${baseURL}call-management/getUpdateMessageStatus`
export const upsertInviteCallers = `${baseURL}call-management/upsert-message`
export const getCallHistoryReasonById = `${baseURL}call-management/getMessageListById`
export const getFilterListWACaller = `${baseURL}call-management/getFilterList`














export const loginUrl = `${baseURL}user/login`
export const resendUrl = `${baseURL}user/resend-verification`
export const verifyUrl = `${baseURL}otp/verify`

export const forgotPasswordUrl = `${baseURL}user/forgot-password`
export const registerUrl = `${baseURL}user/register`
export const userProfileUpdateUrl = `${baseURL}user/update`
export const verifyTokenUrl = `${baseURL}/verify_token`
export const resetPasswordUrl_old = `${baseURL}/reset_password`
export const resetPasswordUrl = `${baseURL}user/reset-password`
export const loginAccessUrl = `${baseURL}user/change-login-access`
export const changePasswordMail = `${baseURL}user/send-changepassword-email`
export const verifyEmailUrl = `${baseURL}/resend_verification_link`
export const approveUrl = `${baseURL}temp-user/approve`
export const rejectUrl = `${baseURL}temp-user/reject`

// ** Events URL

export const addEventURL = `${baseURL}event/create`
export const updateEventURL = `${baseURL}event/update`
export const listsEventsURL = `${baseURL}event/list`
export const deleteEventURL = `${baseURL}event/delete`
export const detailEventURL = `${baseURL}event/`
//category
export const listCategoryURL = `${baseURL}category/list`
export const listOccasionURL = `${baseURL}occasion/list`
export const listFunctionURL = `${baseURL}function/list`
export const listGiftTypeURL = `${baseURL}gift-type/list`
export const listKeyTypeURL = `${baseURL}key-type/list`
export const listContactsTypeURL = `${baseURL}contacts/list`
export const listUserGroupTypeURL = `${baseURL}user-group/list`
export const listInviteeContactURL = `${baseURL}invitee-contact/list`
export const listMappedContactURL = `${baseURL}additional-detail/list`
export const listInviteeGroupURL = `${baseURL}invitee-group/list`
export const listInviteeInternalGroupURL = `${baseURL}invitee-internal-group/list`

export const listAllContactsTypeURL = `${baseURL}contacts/list-all`
export const listTravelTypeURL = `${baseURL}travel-mode/list`
export const listFirmsURL = `${baseURL}firm/list`
export const listSpecialInviteeURL = `${baseURL}special-invitee/list`
export const listEventURL = `${baseURL}event/list`
export const listEventDetailsURL = `${baseURL}function/details-list`
export const listTransportationURL = `${baseURL}transportation/list`
export const listAccommodationURL = `${baseURL}accommodation/list`
export const listOtherInfoURL = `${baseURL}other-info/list`
export const listCustomMedia = `${baseURL}custom-media/list`
export const listHelplineURL = `${baseURL}help-line/list`
export const listNotificationDispatchURL = `${baseURL}notification-dispatch/list`
export const listNotificationDispatchMediaURL = `${baseURL}notification-dispatch-media/list`
export const listCoursesURL = `${baseURL}course/list`
export const listCourseTopicURL = `${baseURL}course-topic/list`
export const listUsersURL = `${baseURL}user/list`
export const listBatchesURL = `${baseURL}batch/list`
export const updateFunctionNumbers = `${baseURL}function/generate-function-number`

export const getPushTemplates = `${baseURL}push-notification-template/get-templates`
export const mapTemplatesHrs = `${baseURL}push-notification-template/update-hrs`
export const updatemessageHrs = `${baseURL}push-notification-template/update-message`
export const getnotification = `${baseURL}push-notification-template/get-cornmessage`
export const getCustomPushTemplates = `${baseURL}push-notification-template/get-custom-templates`
export const postCustomPushTemplates = `${baseURL}push-notification-template/post-custom-templates`
export const postCustomMappedUser = `${baseURL}push-notification-template/get-custom-mappeduser`
export const updateCustomMappedUser = `${baseURL}push-notification-template/update-custom-mapping`
export const patchCustomPushTemplates = `${baseURL}push-notification-template/patch-custom-templates`
export const deleteCustomPushTemplates = `${baseURL}push-notification-template/delete-custom-templates`
export const postCustomSelectedMappedUser = `${baseURL}push-notification-template/get-custom-selected-mappeduser`
export const updateCustomMappedUserBulk = `${baseURL}push-notification-template/update-custom-mapping/bulk`
export const updateCustomMappedUserBulkSelected = `${baseURL}push-notification-template/update-custom-mapping/bulk-selected`

export const filterContactPush = `${baseURL}push-notification-template/filter-list`

export const getRoleListByfunctionId = `${baseURL}function-roles/list-role`
export const createRoleList = `${baseURL}function-roles/create-role`
export const patchRoleList = `${baseURL}function-roles/patch-role`
export const deleteRoleList = `${baseURL}function-roles/delete-role`

export const getListOfMappedContactTrigger = `${baseURL}function-call/getmappedlist`
export const getFilterListWA = `${baseURL}function-call/getFilterList`
export const getUpdatedWAStatus = `${baseURL}function-call/getUpdateMessageStatus`

export const getTempalteListWA = `${baseURL}function-call/get-template-list`
export const addTemplateListWA = `${baseURL}function-call/add-watrigger-templates`
export const updateTempalateListWA = `${baseURL}function-call/update-watrigger-templates`
export const deleteTemplateListWA = `${baseURL}function-call/delete-template-list`
export const triggerWA = `${baseURL}function-call/triggerwanotification`
export const dropDownWATemp = `${baseURL}function-call/getTemplateDropList`
export const dropDownWATempById = `${baseURL}function-call/getTemplateDropListByID`

export const getFunctionReportsCount = `${baseURL}reports/functionreports`
export const getFunctionReportList = `${baseURL}reports/functionreportslist`
export const rsvpCountList = `${baseURL}reports/rsvpcountlist`
export const rsvpReportList = `${baseURL}reports/rsvpcountlistdetails`
export const notificationCountList = `${baseURL}reports/notificationReport`
export const notificationReportList = `${baseURL}reports/notificationReportcontactList`

// export const functionContactsReportexcel = `${baseURL}reports/functionreportslist?functionId=b5a2cf0c-5e07-4a7b-b81d-1db3a42daf06&type=notification-accommodation&status=seen&search=&oid=56c63162-f5fe-42ea-88e2-fb5d640a58b9&excel=true`
// export const functionContactsReportexcel = `${baseURL}reports/functionreportslist?functionId=bd2d9861-c682-4c81-b066-dbbf6d8206ee&type=function&status=sent&search=&oid=&excel=true`

// export const functionContactsReportexcel = `${baseURL}reports/getmappedContactslist?functionId=80523e1a-ce7f-4753-9a2a-b7043b13f549&type=notification-event&search=&excel=true`

export const postCustomPushAdminTemplates = `${baseURL}push-notification-admin/post-custom-templates-admin`
export const getCustomPushAdminTemplates = `${baseURL}push-notification-admin/get-custom-templates`
export const patchCustomPushAdminTemplates = `${baseURL}push-notification-admin/patch-custom-templates-admin`
export const gestCustomPushAdminAllUsers = `${baseURL}push-notification-admin/get-custom-admin-alluser`
export const deleteCustomPushTemplatesAllUsers = `${baseURL}push-notification-admin/delete-custom-templates`

export const getCustomPushAdminFunctionList = `${baseURL}push-notification-admin/get-function-list`
export const postCustomPushAdminTemplatesFun = `${baseURL}push-notification-admin/post-custom-templates-admin-function`
export const getCustomPushAdminTemplatesFun = `${baseURL}push-notification-admin/get-custom-templates-function`
export const patchCustomPushAdminTemplatesFun = `${baseURL}push-notification-admin/patch-custom-templates-admin-fun`
export const gestCustomPushAdminAllUsersFun = `${baseURL}push-notification-admin/get-custom-selected-mappeduser`
export const deleteCustomPushTemplatesFunUsers = `${baseURL}push-notification-admin/delete-custom-templates-function`
export const updateCustomMappedUserBulkSelectedAdmin = `${baseURL}push-notification-admin/update-custom-mapping/bulk-selected`
export const updateCustomMappedUserAdmin = `${baseURL}push-notification-admin/update-custom-mapping`

export const mapListUrl = `${baseURL}map-management/list-map`
export const deletemapListUrl = `${baseURL}map-management/delete-map`
export const eventListUrl = `${baseURL}map-management/list-event`
export const deleteEventListUrl = `${baseURL}map-management/delete-event`



