import { AbilityBuilder, createMongoAbility } from '@casl/ability'

export const AppAbility = createMongoAbility

/**
 * Please define your own Ability rules according to your app requirements.
 * We have just shown Admin and Client rules for demo purpose where
 * admin can manage everything and client can just visit ACL page
 */
const accessible={};
const defineRulesFor = (role, subject) => {
  console.log('role', role)
  const { can, rules } = new AbilityBuilder(createMongoAbility)
  if (role === 'super-admin') {
    can('manage','accatee')
    can('manage', 'functionreports')
    can('manage', 'assigntasks')
    can('manage', 'usermanage')


    accessible.action = 'manage';
    accessible.subject = 'accatee'
    accessible.action = 'manage'
    accessible.subject = 'usermanage'
    accessible.action = 'manage'
    accessible.subject = 'assigntasks'
    accessible.action = 'manage'
    accessible.subject = 'functionreports'

  } else if (role==='main') {
    // can('manage', 'all')
    // accessible.action = 'manage';
    // accessible.subject = 'all'
        can('manage','accatee')
    can('manage', 'functionreports')
    can('manage', 'assigntasks')
    can('manage', 'usermanage')

    accessible.action = 'manage';
    accessible.subject = 'accatee'
    accessible.action = 'manage'
    accessible.subject = 'usermanage'
    accessible.action = 'manage'
    accessible.subject = 'assigntasks'
    accessible.action = 'manage'
    accessible.subject = 'functionreports'
    

  } else if (role === 'support') {
    // can(['read'], 'acl-page')
    can('manage','accatee')
    can('manage', 'assignedFunction')
    accessible.action = 'manage';
    accessible.subject = 'accatee'
    accessible.action = 'manage'
    accessible.subject = 'assignedFunction'
    
  } else {
    can(['read', 'create', 'update', 'delete'], subject)
  }

  return rules
}

export const buildAbilityFor = (role, subject) => {
  return new AppAbility(defineRulesFor(role, subject), {
    // https://casl.js.org/v5/en/guide/subject-type-detection
    // @ts-ignore
    detectSubjectType: object => object.type
  })
}

// export const defaultACLObj = {
//   action: 'manage',
//   subject: 'all'
// }

 export const defaultACLObj=accessible
export default defineRulesFor

// const defineRulesFor = (role, subject) => {
//   const accessible = []; // <— store multiple permissions

//   const { can, rules } = new AbilityBuilder(createMongoAbility);

//   if (role === 'super-admin') {
//     can('manage', 'accatee');
//     can('manage', 'usermanage');
//     can('manage', 'assigntasks');

//     accessible.push(
//       { action: 'manage', subject: 'accatee' },
//       { action: 'manage', subject: 'usermanage' },
//       { action: 'manage', subject: 'assigntasks' }
//     );

//   } else if (role === 'main') {
//     can('manage', 'all');

//     accessible.push(
//       { action: 'manage', subject: 'all' }
//     );

//   } else if (role === 'support') {
//     can('manage', 'accatee');
//     can('manage', 'assignedFunction');

//     accessible.push(
//       { action: 'manage', subject: 'accatee' },
//       { action: 'manage', subject: 'assignedFunction' }
//     );

//   } else {
//     can(['read', 'create', 'update', 'delete'], subject);

//     accessible.push(
//       { action: ['read', 'create', 'update', 'delete'], subject }
//     );
//   }

//   return { rules, accessible };
// };

// export const buildAbilityFor = (role, subject) => {
//   const { rules, accessible } = defineRulesFor(role, subject);

//   // save accessible globally or return it
//   buildAbilityFor.accessible = accessible;

//   return new AppAbility(rules, {
//     detectSubjectType: object => object.type
//   });
// };
// console.log('buildAbilityFor.accessible---->', buildAbilityFor.accessible);
// // default ACL — now based on role
// export const defaultACLObj = buildAbilityFor?.accessible?.length > 0 && buildAbilityFor.accessible || [{ action: 'read', subject: 'accatee' }];
