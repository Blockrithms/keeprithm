const USER = 'user';
const ADMIN = 'admin';
const WORKSPACE_OWNER = 'workspaceOwner';

const rolesAllowed = [USER, ADMIN, WORKSPACE_OWNER];
const rightsAllowed = ['create', 'read', 'update', 'delete'];

module.exports = {
  rolesAllowed,
  rightsAllowed,
  USER,
  ADMIN,
  WORKSPACE_OWNER,
};
