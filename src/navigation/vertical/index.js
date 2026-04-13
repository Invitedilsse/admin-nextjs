const navigation = () => {
 return [
  {
    title: 'Home',
    path: '/home',
    icon: 'ri:home-5-fill',
    action: 'read',
    subject: 'accatee'
  },
  {
    title: 'All Function Reports',
    path: '/admin-function-reports',
    icon: 'ri:file-chart-fill',
    action: 'read',
    subject: 'functionreports'
  },
  {
    title: 'User List',
    path: '/users-history',
    icon: 'ri:group-fill',
    action: 'read',
    subject: 'userlist'
  },
  {
    title: 'User Family',
    path: '/user-family',
    icon: 'ri:team-fill',
    action: 'read',
    subject: 'userfamily'
  },
  {
    title: 'Assign Tasks',
    path: '/assign-tasks',
    icon: 'ri:task-fill',
    action: 'read',
    subject: 'assigntasks'
  },
  {
    title: 'Assigned Functions',
    path: '/assigned-functions',
    icon: 'ri:checkbox-circle-fill',
    action: 'read',
    subject: 'assignedFunction'
  },
  {
    title: 'User Management',
    path: '/user-management',
    icon: 'ri:user-settings-fill',
    action: 'read',
    subject: 'usermanage'
  },
  {
    title: 'Map Management',
    path: '/map-management',
    icon: 'ri:map-pin-fill',
    action: 'read',
    subject: 'mapmanage'
  },
  {
    title: 'Manage Functions',
    path: '/function',
    icon: 'ri:settings-3-fill',
    action: 'read',
    subject: 'ufunction'
  },
  {
    title: 'Admin panel',
    path: '/admin-panel',
    icon: 'ri:admin-fill',
    action: 'read',
    subject: 'adminpanel'
  },
      {
      title: 'Campaign Management',
      path: '/campaign',
      icon: 'maki:information',
      action: 'read',
      subject: 'campaign'
    }
]
}

export default navigation
