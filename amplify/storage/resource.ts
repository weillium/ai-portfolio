import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'portfolioStorage',
  isDefault: true,
  access: (allow) => ({
    'public/*': [
        allow.guest.to(['read']),
        allow.groups(['admin']).to(['read', 'write', 'delete'])
    ], 
    'project-icons/*': [
        allow.guest.to(['read']),
        allow.groups(['admin']).to(['read', 'write', 'delete'])
    ],
  }),
});