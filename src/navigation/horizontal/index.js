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
    title: 'Family Plus',
    path: '/user-family',
    icon: 'tabler:heart-handshake',
    action: 'read',
    subject: 'userfamily'
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
    icon: 'tabler:map-pin',
    action: 'read',
    subject: 'ocrmanage'
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
      {
      title: 'Campaign Management',
      path: '/campaign',
      icon: 'tabler:info-circle',
      action: 'read',
      subject: 'campaign'
    },
     {
      title: 'Advertisement Creation',
      path: '/adcreation',
      icon: 'tabler:movie',
      action: 'read',
      subject: 'adcreation'
    },
    {
      title: 'Website Redirect',
      path: '/website-redirect',
      icon: 'tabler:external-link',
      action: 'read',
      subject: 'websiteredirect'
    }
]
}


export default navigation
