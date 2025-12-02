const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'ri:calendar-todo-fill',
      action: 'read',
      subject: 'accatee'
    },
    {
      title: 'User Management',
      path: '/user-management',
      icon: 'ri:calendar-todo-fill',
      action: 'read',
      subject: 'usermanage'
    },
     {
      title: 'Assign Tasks',
      path: '/assign-tasks',
      icon: 'emojione-monotone:party-popper',
      action: 'read',
      subject: 'assigntasks'
    },
         {
      title: 'Assigned Functions',
      path: '/assigned-functions',
      icon: 'emojione-monotone:party-popper',
      action: 'read',
      subject: 'assignedFunction'
    },
    {
      title: 'Manage Functions',
      path: '/function',
      icon: 'emojione-monotone:party-popper',
      action: 'read',
      subject: 'ufunction'
    },
    {
      title: 'Admin panel',
      path: '/admin-panel',
      icon: 'ri:calendar-todo-fill',
      action: 'read',
      subject: 'adminpanel'
    },
  ]
}


export default navigation
