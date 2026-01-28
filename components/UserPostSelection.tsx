
import React, { useState, useMemo } from 'react';
import { AppData, User, UserType, Post } from '../types';
import { Briefcase, X, Plus, Info, CheckCircle2, Search, ArrowRight, Lock, Trash2 } from 'lucide-react';

interface UserPostSelectionProps {
  data: AppData;
  currentUser: User;
  onToggle: (postId: number) => void;
}

const UserPostSelection: React.FC<UserPostSelectionProps> = ({ data, currentUser, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const selections = data.userPostSelections || {};
  const currentUserId = Number(currentUser.User_ID);
  const rawSelections = selections[currentUserId];
  const selectedPostIds = Array.isArray(rawSelections) ? rawSelections.map(id => Number(id)) : [];
  const isAdmin = currentUser.User_Type === UserType.ADMIN;

  // Helper to check if a post is in use by any employee
  const getUsageCount = (postId: number) => {
    return (data.employees || []).filter(emp => Number(emp.Post_ID) === postId).length;
  };

  // Derive the two lists: Selected and Available
  const selectedPosts = useMemo(() => 
    (data.posts || []).filter(p => selectedPostIds.includes(Number(p.Post_ID))),
    [data.posts, selectedPostIds]
  );

  const availablePosts = useMemo(() => 
    (data.posts || []).filter(p => 
      !selectedPostIds.includes(Number(p.Post_ID)) &&
      (searchTerm === '' || p.Post_Name.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [data.posts, selectedPostIds, searchTerm]
  );

  const handleRemove = (post: Post) => {
    const count = getUsageCount(Number(post.Post_ID));
    if (count > 0) {
      alert(`Cannot remove "${post.Post_Name}": This designation is currently assigned to ${count} employee(s). Please update those employee records first.`);
      return;
    }
    onToggle(Number(post.Post_ID));
  };

  if (isAdmin) {
    return (
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-4 px-4">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary-subtle p-3 rounded-4 text-primary">
              <Briefcase size={28} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Designation Repository</h5>
              <p className="text-muted small mb-0">Full catalog of organizational posts and global usage statistics</p>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr className="tiny text-uppercase fw-bold text-muted">
                <th className="ps-4 py-3">Post Name</th>
                <th>Category</th>
                <th className="text-center">Class</th>
                <th>Global Usage</th>
                <th className="text-end pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.posts.map(post => {
                const count = getUsageCount(Number(post.Post_ID));
                return (
                  <tr key={post.Post_ID}>
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark">{post.Post_Name}</div>
                      <div className="tiny text-muted uppercase">POST ID: #{post.Post_ID}</div>
                    </td>
                    <td><span className="badge bg-light text-dark border fw-normal">{post.Category}</span></td>
                    <td className="text-center"><span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 fw-normal">Class {post.Class}</span></td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1 bg-light" style={{height: '6px', maxWidth: '100px'}}>
                          <div className="progress-bar bg-primary" style={{width: `${Math.min(count * 5, 100)}%`}}></div>
                        </div>
                        <span className="small fw-bold text-primary">{count}</span>
                      </div>
                    </td>
                    <td className="text-end pe-4"><span className="badge bg-success-subtle text-success px-3">Active</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="designation-manager animate-fade-in">
      {/* TOP SECTION: SELECTED BOX */}
      <div className="card shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-4 px-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary-subtle p-2 rounded-3 text-primary shadow-sm">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold">My Active Designations</h6>
              <p className="tiny text-muted mb-0">Posts you can currently assign to employees</p>
            </div>
          </div>
          <span className="badge bg-primary rounded-pill px-3 py-2 fw-normal">{selectedPosts.length} Mapped</span>
        </div>
        <div className="card-body bg-light-subtle p-4">
          {selectedPosts.length > 0 ? (
            <div className="row g-3">
              {selectedPosts.map(post => {
                const usageCount = getUsageCount(Number(post.Post_ID));
                const isLocked = usageCount > 0;
                
                return (
                  <div key={post.Post_ID} className="col-12 col-md-6 col-lg-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100 bg-white selection-card">
                      <div className="card-body p-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3 min-width-0">
                          <div className="bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                            <Briefcase size={20} />
                          </div>
                          <div className="min-width-0">
                            <div className="fw-bold text-dark text-truncate" style={{fontSize: '0.9rem'}}>{post.Post_Name}</div>
                            <div className="tiny text-muted text-truncate uppercase">Class {post.Class} • {post.Category}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemove(post)}
                          className={`btn btn-sm rounded-circle p-2 border-0 ms-2 transition-all ${isLocked ? 'btn-light text-muted opacity-50 cursor-not-allowed' : 'btn-danger-subtle text-danger'}`}
                          title={isLocked ? `Locked: Assigned to ${usageCount} employees` : "Remove Designation"}
                        >
                          {isLocked ? <Lock size={14} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                      {isLocked && (
                        <div className="bg-primary-subtle px-3 py-1 tiny text-primary fw-bold text-center border-top border-primary-subtle">
                          Mapped to {usageCount} Employee(s)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="bg-white d-inline-flex p-4 rounded-circle shadow-sm mb-3">
                <Briefcase size={40} className="text-muted opacity-25" />
              </div>
              <h6 className="text-muted fw-bold">No Designations Selected</h6>
              <p className="text-muted small mx-auto" style={{maxWidth: '300px'}}>Select designations from the list below to enable them for your office records.</p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: ADD MORE */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom py-4 px-4">
          <div className="row align-items-center g-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success-subtle p-2 rounded-3 text-success shadow-sm">
                  <Plus size={24} />
                </div>
                <h6 className="mb-0 fw-bold">Add Available Designations</h6>
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted ps-3"><Search size={18} /></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0" 
                  placeholder="Filter designations not in your list..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive" style={{maxHeight: '450px'}}>
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light sticky-top" style={{zIndex: 10}}>
                <tr className="tiny text-uppercase fw-bold text-muted">
                  <th className="ps-4 py-3">Designation Name</th>
                  <th>Classification</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {availablePosts.length > 0 ? (
                  availablePosts.map(post => (
                    <tr key={post.Post_ID}>
                      <td className="ps-4 py-3">
                        <div className="fw-semibold text-dark">{post.Post_Name}</div>
                        <div className="tiny text-muted uppercase">{post.Category} Category</div>
                      </td>
                      <td><span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 fw-normal">Class {post.Class}</span></td>
                      <td className="text-end pe-4">
                        <button 
                          onClick={() => onToggle(Number(post.Post_ID))}
                          className="btn btn-sm btn-primary rounded-pill px-4 d-inline-flex align-items-center gap-2 shadow-sm transition-all"
                        >
                          <Plus size={14} /> Add to My List
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-5">
                      <div className="text-muted mb-0 small py-4">
                        {searchTerm ? (
                          <>No designations found matching "<strong>{searchTerm}</strong>"</>
                        ) : (
                          "All available designations have been added to your active list."
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer bg-light-subtle py-3 border-top text-center">
          <div className="small text-muted d-flex align-items-center justify-content-center gap-2">
            <Info size={16} className="text-primary" />
            Selection changes are automatically synced to your profile.
          </div>
        </div>
      </div>

      <style>{`
        .selection-card { transition: all 0.2s ease; border: 1px solid #f1f5f9 !important; }
        .selection-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important; }
        .btn-danger-subtle { background-color: #fee2e2; color: #dc2626; }
        .btn-danger-subtle:hover { background-color: #dc2626; color: white; }
        .bg-light-subtle { background-color: #f8fafc; }
        .tiny { font-size: 0.7rem; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .min-width-0 { min-width: 0; }
        .cursor-not-allowed { cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default UserPostSelection;
