
import React, { useState } from 'react';
import { Post, Payscale, AppData } from '../types';
import { Briefcase, DollarSign, Plus, Save, Trash2, Edit2, X, Lock } from 'lucide-react';

interface ServiceMasterProps {
  data: AppData;
  onSavePost: (post: Post) => void;
  onDeletePost: (postId: number) => void;
  onSavePayscale: (pay: Payscale) => void;
  onDeletePayscale: (payId: number) => void;
}

const ServiceMasterManagement: React.FC<ServiceMasterProps> = ({ data, onSavePost, onDeletePost, onSavePayscale, onDeletePayscale }) => {
  const [editingPost, setEditingPost] = useState<Partial<Post> | null>(null);
  const [editingPay, setEditingPay] = useState<Partial<Payscale> | null>(null);

  const handlePostSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost?.Post_Name) {
      onSavePost(editingPost as Post);
      setEditingPost(null);
    }
  };

  const handlePaySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPay?.Pay_Name) {
      onSavePayscale(editingPay as Payscale);
      setEditingPay(null);
    }
  };

  const isPostDeletable = (id: number) => {
    const hasEmployees = data.employees.some(e => Number(e.Post_ID) === id);
    // Fixed: Explicitly handle the 'unknown' type inference from Object.values to prevent TS error
    const hasMappings = Object.values(data.userPostSelections || {}).some((arr: any) => 
      Array.isArray(arr) && arr.includes(id)
    );
    return !hasEmployees && !hasMappings;
  };

  const isPayDeletable = (id: number) => {
    return !data.employees.some(e => Number(e.Pay_ID) === id);
  };

  return (
    <div className="row g-4">
      <div className="col-lg-7">
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary-subtle p-2 rounded-3 text-primary shadow-sm">
                <Briefcase size={20} />
              </div>
              <h6 className="mb-0 fw-bold">Post/Designation Master</h6>
            </div>
            {!editingPost && <button onClick={() => setEditingPost({})} className="btn btn-sm btn-primary px-3 rounded-pill shadow-sm"><Plus size={14} /> Add Post</button>}
          </div>
          <div className="card-body p-0">
            {editingPost && (
              <div className="p-3 bg-light border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="small fw-bold mb-0">Post Configuration</h6>
                  <button type="button" onClick={() => setEditingPost(null)} className="btn btn-link text-muted p-0"><X size={16} /></button>
                </div>
                <form onSubmit={handlePostSave} className="row g-2">
                  <div className="col-md-5">
                    <input className="form-control form-control-sm" placeholder="Post Name" value={editingPost.Post_Name || ''} onChange={e => setEditingPost({...editingPost, Post_Name: e.target.value})} required />
                  </div>
                  <div className="col-md-3">
                    <select className="form-select form-select-sm" value={editingPost.Class || ''} onChange={e => setEditingPost({...editingPost, Class: e.target.value})} required>
                      <option value="">Class...</option>
                      <option value="I">Class I</option>
                      <option value="II">Class II</option>
                      <option value="III">Class III</option>
                      <option value="IV">Class IV</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <input className="form-control form-control-sm" placeholder="Cat." value={editingPost.Category || ''} onChange={e => setEditingPost({...editingPost, Category: e.target.value})} />
                  </div>
                  <div className="col-md-2">
                    <button type="submit" className="btn btn-primary btn-sm w-100 shadow-sm"><Save size={14} /></button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small">
                    <th className="ps-3">Post Name</th>
                    <th>Class</th>
                    <th className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.posts.map(p => {
                    const deletable = isPostDeletable(Number(p.Post_ID));
                    return (
                      <tr key={p.Post_ID} className="small">
                        <td className="ps-3 fw-semibold">{p.Post_Name} <span className="text-muted small">({p.Category})</span></td>
                        <td><span className="badge bg-light text-dark border">{p.Class}</span></td>
                        <td className="text-end pe-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <button onClick={() => setEditingPost(p)} className="btn btn-link btn-sm text-primary p-0"><Edit2 size={14} /></button>
                            {deletable ? (
                              <button onClick={() => onDeletePost(Number(p.Post_ID))} className="btn btn-link btn-sm text-danger p-0"><Trash2 size={14} /></button>
                            ) : (
                              <button className="btn btn-link btn-sm text-muted p-0 opacity-50" title="In Use" disabled><Lock size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-5">
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-success-subtle p-2 rounded-3 text-success shadow-sm">
                <DollarSign size={20} />
              </div>
              <h6 className="mb-0 fw-bold">Payscale Master</h6>
            </div>
            {!editingPay && <button onClick={() => setEditingPay({})} className="btn btn-sm btn-success px-3 rounded-pill shadow-sm"><Plus size={14} /> Add Scale</button>}
          </div>
          <div className="card-body p-0">
            {editingPay && (
              <div className="p-3 bg-light border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="small fw-bold mb-0">Pay Scale Config</h6>
                  <button type="button" onClick={() => setEditingPay(null)} className="btn btn-link text-muted p-0"><X size={16} /></button>
                </div>
                <form onSubmit={handlePaySave} className="input-group input-group-sm">
                  <input className="form-control" placeholder="Level/Scale Name" value={editingPay.Pay_Name || ''} onChange={e => setEditingPay({...editingPay, Pay_Name: e.target.value})} required />
                  <button type="submit" className="btn btn-success"><Save size={14} /></button>
                </form>
              </div>
            )}
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small">
                    <th className="ps-3">Scale Name</th>
                    <th className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payscales.map(s => {
                    const deletable = isPayDeletable(Number(s.Pay_ID));
                    return (
                      <tr key={s.Pay_ID} className="small">
                        <td className="ps-3 fw-semibold">{s.Pay_Name}</td>
                        <td className="text-end pe-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <button onClick={() => setEditingPay(s)} className="btn btn-link btn-sm text-primary p-0"><Edit2 size={14} /></button>
                            {deletable ? (
                              <button onClick={() => onDeletePayscale(Number(s.Pay_ID))} className="btn btn-link btn-sm text-danger p-0"><Trash2 size={14} /></button>
                            ) : (
                              <button className="btn btn-link btn-sm text-muted p-0 opacity-50" title="In Use" disabled><Lock size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceMasterManagement;
