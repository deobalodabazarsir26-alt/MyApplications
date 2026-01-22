
import React from 'react';
import { AppData, User, UserType } from '../types';
import { Briefcase, CheckCircle2, Circle, Search } from 'lucide-react';

interface UserPostSelectionProps {
  data: AppData;
  currentUser: User;
  onToggle: (postId: number) => void;
}

const UserPostSelection: React.FC<UserPostSelectionProps> = ({ data, currentUser, onToggle }) => {
  const selectedPostIds = data.userPostSelections[currentUser.User_ID] || [];
  const isAdmin = currentUser.User_Type === UserType.ADMIN;

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="card-header bg-white border-bottom py-3">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary-subtle p-2 rounded-3 text-primary">
            <Briefcase size={24} />
          </div>
          <div>
            <h5 className="mb-0 fw-bold">
              {isAdmin ? 'Post Master List' : 'Post Selection'}
            </h5>
            <p className="text-muted small mb-0">
              {isAdmin 
                ? 'Viewing all system-wide designations' 
                : 'Select posts you frequently use for employee data entry'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                {!isAdmin && <th className="ps-4 border-0 text-center" style={{width: '60px'}}>Pick</th>}
                <th className={isAdmin ? "ps-4 border-0" : "border-0"}>Post Name</th>
                <th className="border-0">Category</th>
                <th className="border-0 text-center">Class</th>
                {isAdmin && <th className="text-end pe-4 border-0">Status</th>}
              </tr>
            </thead>
            <tbody>
              {data.posts.map((post) => {
                const isSelected = selectedPostIds.includes(post.Post_ID);
                return (
                  <tr key={post.Post_ID} className={isSelected ? "table-primary-subtle" : ""}>
                    {!isAdmin && (
                      <td className="ps-4 text-center">
                        <button 
                          onClick={() => onToggle(post.Post_ID)}
                          className={`btn btn-sm p-1 rounded-circle border-0 ${isSelected ? 'text-primary' : 'text-muted opacity-25'}`}
                        >
                          {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                      </td>
                    )}
                    <td className={isAdmin ? "ps-4 fw-semibold" : "fw-semibold"}>
                      {post.Post_Name}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border fw-normal px-2">
                        {post.Category}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge badge-soft-primary px-3 rounded-pill">
                        {post.Class}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="text-end pe-4">
                        <span className="small text-success fw-bold text-uppercase">Active</span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {!isAdmin && (
        <div className="card-footer bg-light py-3 border-top-0">
          <div className="small text-muted text-center fw-medium">
            Selected: <span className="text-primary fw-bold">{selectedPostIds.length}</span> / {data.posts.length} available posts
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPostSelection;
