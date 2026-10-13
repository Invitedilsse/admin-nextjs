/**
 * The sidebar.
 * -------------------------------------------------------------------------------------
 * Eighteen flat items is a list, not a menu: nothing tells you which screens belong
 * together, and the eye has to read all eighteen labels to find one. Three groups take
 * it to twelve rows, with the related screens folded away until you want them.
 *
 * ! A GROUP MUST NOT DECLARE action/subject.
 *   CanViewNavGroup (src/layouts/components/acl/CanViewNavGroup.js) reads them like
 *   this: if a group HAS an action and a subject, the viewer needs that permission AND
 *   a visible child; if it has neither, the group simply shows whenever any child is
 *   visible. Leaving them off means these groups need no new ACL subjects and no
 *   change to src/configs/acl.js - a role that can see one child sees the group, and a
 *   role that can see none never knows it exists.
 *
 * ! Children keep their own action/subject exactly as they had them, so permissions
 *   are unchanged by the grouping.
 *
 * The header reads this file too (src/@core/layouts/utils/page-title.js flattens
 * children), so a title changed here changes the page header with it.
 */
const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'tabler:home',
      action: 'read',
      subject: 'accatee'
    },
    {
      title: 'All Function Reports',
      path: '/admin-function-reports',
      icon: 'tabler:report-analytics',
      action: 'read',
      subject: 'functionreports'
    },
    {
      title: 'User List',
      path: '/users-history',
      icon: 'tabler:users',
      action: 'read',
      subject: 'userlist'
    },
    {
      title: 'Assign Tasks',
      path: '/assign-tasks',
      icon: 'tabler:clipboard-list',
      action: 'read',
      subject: 'assigntasks'
    },
    {
      title: 'Assigned Functions',
      path: '/assigned-functions',
      icon: 'tabler:circle-check',
      action: 'read',
      subject: 'assignedFunction'
    },

    // ** The four admin consoles. They were four separate rows that all ended in the
    //    word "Management", which is the clearest sign a group was missing.
    {
      title: 'Management',
      icon: 'tabler:adjustments',
      children: [
        {
          title: 'User Management',
          path: '/user-management',
          icon: 'tabler:lock-access',
          action: 'read',
          subject: 'usermanage'
        },
        {
          title: 'Offline Management',
          path: '/map-management',
          icon: 'tabler:map-pin',
          action: 'read',
          subject: 'mapmanage'
        },
        {
          title: 'OCR Management',
          path: '/ocr-management',
          icon: 'tabler:scan-eye',
          action: 'read',
          subject: 'ocrmanage'
        },
        {
          title: 'Campaign Management',
          path: '/campaign',
          icon: 'tabler:speakerphone',
          action: 'read',
          subject: 'campaign'
        }
      ]
    },

    {
      title: 'Manage Functions',
      path: '/function',
      icon: 'tabler:settings',
      action: 'read',
      subject: 'ufunction'
    },
    {
      title: 'Admin panel',
      path: '/admin-panel',
      icon: 'tabler:shield-lock',
      action: 'read',
      subject: 'adminpanel'
    },

    // ** Everything that puts something in front of a guest outside the app.
    {
      title: 'Ad Management',
      icon: 'tabler:ad',
      children: [
        {
          title: 'Advertisement Creation',
          path: '/adcreation',
          icon: 'tabler:photo',
          action: 'read',
          subject: 'adcreation'
        },
        {
          // ** Was 'Webiste Redirect' in the sidebar, which also fed the page header.
          title: 'Website Redirect',
          path: '/website-redirect',
          icon: 'tabler:external-link',
          action: 'read',
          subject: 'websiteredirect'
        }
      ]
    },

    // ** The three family screens, which had been scattered: Family Plus sat up with
    //    the user lists while Reminders and Documents sat at the bottom.
    {
      title: 'Invite & Family',
      icon: 'tabler:home-heart',
      children: [
        {
          title: 'Family Plus',
          path: '/user-family',
          icon: 'tabler:heart-handshake',
          action: 'read',
          subject: 'userfamily'
        },
        {
          title: 'Family Reminders',
          path: '/reminder-management',
          icon: 'tabler:bell',
          action: 'read',
          subject: 'remindermanage'
        },
        {
          title: 'Family Documents',
          path: '/family-documents',
          icon: 'tabler:file-text',
          action: 'read',
          subject: 'familydocuments'
        }
      ]
    },

    {
      title: 'WhatsApp Bot',
      path: '/whatsapp-bot',
      icon: 'tabler:message-chatbot',
      action: 'read',
      subject: 'whatsappbot'
    },
    {
      // One entry, four steps inside it. Three separate items made a sequence
      // look like three unrelated tools, and left nowhere to put the fourth.
      title: 'WhatsApp Invites',
      path: '/campaign/whatsapp-pdf',
      icon: 'tabler:brand-whatsapp',
      action: 'read',
      subject: 'campaign'
    }
  ]
}

export default navigation
