#!/usr/bin/env python3
"""
Wire the notification composer into admin-nextjs.

Four edits, none of which creates a file: the endpoints, the two ACL grants,
and the nav entry. The page itself and the five admin-nodejs files are written
separately.

Run from anywhere:  python3 apply_composer_wiring.py
Set ADMIN_NEXTJS to override the repo path.

Every anchor must match EXACTLY ONCE or the script refuses and changes nothing.
Line endings are detected per file and preserved - pathConst.js is LF while
acl.js and the navigation are CRLF, and rewriting either one wholesale would
show up as a diff touching every line.
"""

import io
import os
import sys

ROOT = os.environ.get('ADMIN_NEXTJS') or (
    os.path.expanduser('~') + '/mnt/admin-nextjs'
)


def edit(rel, pairs):
    path = os.path.join(ROOT, rel)

    with open(path, 'rb') as fh:
        raw = fh.read()

    crlf = raw.count(b'\r\n')
    lf = raw.count(b'\n') - crlf
    eol = '\r\n' if crlf > lf else '\n'
    text = raw.decode('utf-8').replace('\r\n', '\n')

    for old, new, times in pairs:
        found = text.count(old)

        if found != times:
            print('REFUSED %s: anchor occurs %d times (needs %d)\n---\n%s\n---'
                  % (rel, found, times, old[:300]))
            sys.exit(1)

        text = text.replace(old, new, times)

    body = text if eol == '\n' else text.replace('\n', '\r\n')

    with open(path, 'wb') as fh:
        fh.write(body.encode('utf-8'))

    print('ok   %s (%s)' % (rel, 'CRLF' if eol == '\r\n' else 'LF'))


# ───────────────────────────────────────────────────────────── the endpoints
#
# `adminUploadDoc` is the portal's existing uploader (admin-nodejs
# src/admin/controller.js). It answers with a PLAIN PERMANENT S3 url, which is
# the only kind usable here: a notification banner has to still render in
# somebody's tab months later, and a presigned url cannot outlive seven days.
edit('src/services/pathConst.js', [(
    "export const activeUsersList = `${baseURL}active-users/list`",
    "export const activeUsersList = `${baseURL}active-users/list`",
    1,
), (
    "export const activeUsersCheck = `${baseURL}active-users/check`",
    "export const activeUsersCheck = `${baseURL}active-users/check`\n"
    "\n"
    "// Writing a notification and sending it. `send` is the one endpoint in\n"
    "// this portal that cannot be undone.\n"
    "export const notificationComposerOptions = `${baseURL}notification-composer/options`\n"
    "export const notificationComposerFunctions = `${baseURL}notification-composer/functions`\n"
    "export const notificationComposerAudience = `${baseURL}notification-composer/audience`\n"
    "export const notificationComposerHistory = `${baseURL}notification-composer/history`\n"
    "export const notificationComposerSend = `${baseURL}notification-composer/send`\n"
    "\n"
    "// The portal's own uploader. Answers with a permanent S3 url, which is what\n"
    "// a notification banner needs - a presigned one dies after seven days.\n"
    "export const adminUploadDoc = `${baseURL}admin/upload-doc`",
    1,
)])


# ──────────────────────────────────────────────────────────────────── the ACL
#
# Both occurrences: the super-admin block and the main block. The support block
# is left alone because the API's AdminOnly allows only those two roles, and a
# nav entry that leads to a 403 is worse than no nav entry.
edit('src/configs/acl.js', [(
    "    can('manage','activeusers')",
    "    can('manage','activeusers')\n    can('manage','sendnotification')",
    2,
)])


# ───────────────────────────────────────────────────────────────── the nav
edit('src/navigation/vertical/index.js', [(
    """    {
      title: 'Active Users',
      path: '/active-users',
      icon: 'tabler:device-mobile-check',
      action: 'read',
      subject: 'activeusers'
    },""",
    """    {
      title: 'Active Users',
      path: '/active-users',
      icon: 'tabler:device-mobile-check',
      action: 'read',
      subject: 'activeusers'
    },
    {
      title: 'Send Notification',
      path: '/send-notification',
      icon: 'tabler:bell-plus',
      action: 'read',
      subject: 'sendnotification'
    },""",
    1,
)])

print('\nwiring done')
