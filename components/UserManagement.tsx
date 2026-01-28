
import React, { useState, useMemo } from 'react';
import { User, UserType, AppData } from '../types';
import { ShieldCheck, Plus, User as UserIcon, Lock, Save, Trash2, Edit2, X, AlertCircle, ChevronDown, ChevronUp, Search, Filter, XCircle, Tag } from 'lucide-react';

interface UserManagementProps {
  data: AppData;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: number) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ data, onSaveUser, onDeleteUser }) => {
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set());
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const toggleUserExpansion = (userId: number) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const filteredUsers = useMemo(() => {
    return data.users.filter(user => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        user.User_Name.toLowerCase().includes(term) || 
        user.User_ID.toString().includes(term);
      
      const matchesType = !typeFilter || user.User_Type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [data.users, searchTerm, typeFilter]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!editingUser?.User_Name?.trim()) newErrors.User_Name = "Required";
    if (!editingUser?.Password?.trim()) newErrors.Password = "Required";
    if (!editingUser?.User_Type) newErrors.User_Type = "Required";

    // Duplicate username check
    const isDuplicate = data.users.some(u => 
      u.User_Name === editingUser?.User_Name && 
      (!editingUser.User_ID || u.User_ID !== editingUser.User_ID)
    );
    if (isDuplicate) newErrors.User_Name = "Username already exists";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSaveUser(editingUser as User);
      setEditingUser(null);
    }
  };

  const isDeletable = (userId: number) => {
    const hasOffices = data.offices.some(o => Number(o.User_ID) === userId);
    return !hasOffices;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
  };

  // Safe mapping for user type to ensure exact match with enum keys in the dropdown
  const getSelectedUserType = (val: string | undefined): string => {
    if (!val) return '';
    const normalized = val.trim().toLowerCase();
    if (normalized === 'admin') return UserType.ADMIN;
    if (normalized === 'normal') return UserType.NORMAL;
    return val;
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="card-header bg-white border-bottom py-4 px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary-subtle p-2 rounded-3 text-primary shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">User Access Registry</h5>
              <p className="text-muted small mb-0">Manage system credentials and permission levels</p>
            </div>
          </div>
          {!editingUser && (
            <button onClick={() => setEditingUser({ User_Type: UserType.NORMAL })} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4">
              <Plus size={18} /> New System User
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="row g-3">
          <div className="col-md-5">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-1" 
                placeholder="Search by username or ID..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                <Tag size={16} />
              </span>
              <select 
                className="form-select border-start-0 ps-1 fw-medium" 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Access Levels</option>
                {Object.values(UserType).map(type => (
                  <option key={type} value={type}>{type} Accounts</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-3">
            <button 
              onClick={clearFilters} 
              className="btn btn-outline-secondary w-100 h-100 d-flex align-items-center justify-content-center gap-2 shadow-sm border-2 fw-semibold"
              disabled={!searchTerm && !typeFilter}
            >
              <XCircle size={18} /> Reset All
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {editingUser && (
          <div className="bg-light p-4 border-bottom animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                <Filter size={18} />
                {editingUser.User_ID ? 'Update User Privileges' : 'Register New System User'}
              </h6>
              <button type="button" onClick={() => setEditingUser(null)} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-bold">Username *</label>
                <div className="input-group has-validation">
                  <span className="input-group-text bg-white"><UserIcon size={16} /></span>
                  <input 
                    required 
                    value={editingUser.User_Name || ''} 
                    onChange={e => setEditingUser({...editingUser, User_Name: e.target.value})} 
                    className={`form-control ${errors.User_Name ? 'is-invalid' : ''}`}
                    placeholder="Workspace ID"
                  />
                  <div className="invalid-feedback">{errors.User_Name}</div>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Security Password *</label>
                <div className="input-group has-validation">
                  <span className="input-group-text bg-white"><Lock size={16} /></span>
                  <input 
                    type="password"
                    required 
                    value={editingUser.Password || ''} 
                    onChange={e => setEditingUser({...editingUser, Password: e.target.value})} 
                    className={`form-control ${errors.Password ? 'is-invalid' : ''}`}
                    placeholder="Enter password"
                  />
                  <div className="invalid-feedback">{errors.Password}</div>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">User Access Level *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><ShieldCheck size={16} /></span>
                  <select 
                    className="form-select"
                    value={getSelectedUserType(editingUser.User_Type)}
                    onChange={e => setEditingUser({...editingUser, User_Type: e.target.value as UserType})}
                  >
                    <option value="">-- Assign Role --</option>
                    {Object.values(UserType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-12 text-end mt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-light px-4 me-2">Discard</button>
                <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-2 shadow-sm d-inline-flex">
                  <Save size={18} /> {editingUser.User_ID ? 'Update Account' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4 border-0">User Identity</th>
                <th className="border-0">Account Level</th>
                <th className="border-0">Office Custody</th>
                <th className="text-end pe-4 border-0">Operations</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                  const userId = Number(user.User_ID);
                  const assignedOffices = data.offices.filter(o => Number(o.User_ID) === userId);
                  const deletable = isDeletable(userId);
                  const isExpanded = expandedUsers.has(userId);
                  
                  const showAll = assignedOffices.length > 5;
                  const visibleOffices = isExpanded ? assignedOffices : assignedOffices.slice(0, 5);
                  const remainingCount = assignedOffices.length - 5;

                  return (
                    <tr key={user.User_ID}>
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{user.User_Name}</div>
                        <div className="tiny text-muted uppercase fw-bold tracking-wider" style={{fontSize: '0.6rem'}}>SYSTEM ID: #{user.User_ID}</div>
                      </td>
                      <td>
                        <span className={`badge ${user.User_Type === UserType.ADMIN ? 'bg-primary shadow-sm' : 'bg-success-subtle text-success border border-success-subtle'} rounded-pill px-3 py-1 fw-medium`}>
                          {user.User_Type}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap align-items-center gap-1" style={{ maxWidth: '400px' }}>
                          {assignedOffices.length > 0 ? (
                            <>
                              {visibleOffices.map(o => (
                                <span key={o.Office_ID} className="badge bg-light text-dark border small fw-normal">
                                  {o.Office_Name}
                                </span>
                              ))}
                              {!isExpanded && showAll && (
                                <span className="text-muted small fw-bold px-1">
                                  + {remainingCount} more
                                </span>
                              )}
                              {showAll && (
                                <button 
                                  onClick={() => toggleUserExpansion(userId)}
                                  className="btn btn-link btn-sm p-0 ms-1 text-primary text-decoration-none fw-bold d-flex align-items-center gap-1"
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {isExpanded ? (
                                    <>Less <ChevronUp size={12} /></>
                                  ) : (
                                    <>More <ChevronDown size={12} /></>
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-muted small italic">No office assignments</span>
                          )}
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button onClick={() => setEditingUser(user)} className="btn btn-light btn-sm rounded-3 border text-primary shadow-sm" title="Edit Account"><Edit2 size={16} /></button>
                          {deletable ? (
                            <button onClick={() => onDeleteUser(Number(user.User_ID))} className="btn btn-light btn-sm rounded-3 border text-danger shadow-sm" title="Delete Account"><Trash2 size={16} /></button>
                          ) : (
                            <button className="btn btn-light btn-sm rounded-3 border text-muted opacity-50" title="Locked: Custodian for active offices" disabled><Lock size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-5 text-muted">
                    No system users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer bg-white border-top py-3 px-4">
        <span className="small text-muted">Showing <strong>{filteredUsers.length}</strong> active system accounts</span>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .tiny { font-size: 0.7rem; }
      `}</style>
    </div>
  );
};

export default UserManagement;
