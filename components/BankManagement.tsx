
import React, { useState } from 'react';
import { Bank, BankBranch, AppData } from '../types';
import { Plus, Landmark, Building, Hash, Save, MapPin, Trash2, Edit2, Lock, X } from 'lucide-react';

interface BankManagementProps {
  data: AppData;
  onSaveBank: (bank: Bank) => void;
  onDeleteBank: (bankId: number) => void;
  onSaveBranch: (branch: BankBranch) => void;
  onDeleteBranch: (branchId: number) => void;
}

const BankManagement: React.FC<BankManagementProps> = ({ data, onSaveBank, onDeleteBank, onSaveBranch, onDeleteBranch }) => {
  const [editingBank, setEditingBank] = useState<Partial<Bank> | null>(null);
  const [editingBranch, setEditingBranch] = useState<Partial<BankBranch> | null>(null);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBank?.Bank_Name?.trim()) {
      onSaveBank(editingBank as Bank);
      setEditingBank(null);
    }
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch?.Branch_Name && editingBranch?.IFSC_Code && editingBranch?.Bank_ID) {
      onSaveBranch(editingBranch as BankBranch);
      setEditingBranch(null);
    }
  };

  const isBankDeletable = (bankId: number) => {
    const hasBranches = (data.branches || []).some(b => Number(b.Bank_ID) === bankId);
    const hasEmployees = (data.employees || []).some(e => Number(e.Bank_ID) === bankId);
    return !hasBranches && !hasEmployees;
  };

  const isBranchDeletable = (branchId: number) => {
    // Explicitly check against employee branch assignments
    return !(data.employees || []).some(e => Number(e.Branch_ID) === branchId);
  };

  return (
    <div className="row g-4">
      {/* BANKS MASTER */}
      <div className="col-lg-5">
        <div className="card shadow-sm border-0 rounded-4 h-100">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary-subtle p-2 rounded-3 text-primary">
                <Landmark size={20} />
              </div>
              <h6 className="mb-0 fw-bold">Supported Banks</h6>
            </div>
            {!editingBank && (
              <button onClick={() => setEditingBank({})} className="btn btn-sm btn-primary rounded-pill px-3">
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          <div className="card-body">
            {editingBank && (
              <form onSubmit={handleBankSubmit} className="mb-4 bg-light p-3 rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-muted mb-0">{editingBank.Bank_ID ? 'Update Bank' : 'Register New Bank'}</label>
                  <button type="button" onClick={() => setEditingBank(null)} className="btn btn-link text-muted p-0"><X size={16} /></button>
                </div>
                <div className="input-group">
                  <input 
                    placeholder="Enter full bank name..." 
                    value={editingBank.Bank_Name || ''} 
                    onChange={e => setEditingBank({...editingBank, Bank_Name: e.target.value})}
                    className="form-control"
                    required
                  />
                  <button className="btn btn-primary" type="submit">
                    <Save size={18} />
                  </button>
                </div>
              </form>
            )}

            <div className="list-group list-group-flush border rounded-3 overflow-hidden">
              {data.banks.map(bank => {
                const deletable = isBankDeletable(Number(bank.Bank_ID));
                return (
                  <div key={bank.Bank_ID} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-light text-muted p-2 rounded-circle">
                        <Landmark size={14} />
                      </div>
                      <span className="fw-semibold text-dark">{bank.Bank_Name}</span>
                    </div>
                    <div className="d-flex gap-1">
                      <button onClick={() => setEditingBank(bank)} className="btn btn-sm btn-light text-primary border"><Edit2 size={12} /></button>
                      {deletable ? (
                        <button onClick={() => onDeleteBank(Number(bank.Bank_ID))} className="btn btn-sm btn-light text-danger border"><Trash2 size={12} /></button>
                      ) : (
                        <button className="btn btn-sm btn-light text-muted border opacity-50" disabled title="Locked: Bank has branches or active employee records"><Lock size={12} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
              {data.banks.length === 0 && (
                <div className="list-group-item text-center py-4 text-muted small">No banks registered yet</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BRANCHES MASTER */}
      <div className="col-lg-7">
        <div className="card shadow-sm border-0 rounded-4 h-100">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-success-subtle p-2 rounded-3 text-success">
                <Building size={20} />
              </div>
              <h6 className="mb-0 fw-bold">Branch Locations & IFSC</h6>
            </div>
            {!editingBranch && (
              <button onClick={() => setEditingBranch({})} className="btn btn-sm btn-success rounded-pill px-3 shadow-sm">
                <Plus size={14} /> New Branch
              </button>
            )}
          </div>
          <div className="card-body">
            {editingBranch && (
              <form onSubmit={handleBranchSubmit} className="p-3 bg-light rounded-3 border mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 small text-uppercase tracking-wider">{editingBranch.Branch_ID ? 'Update Branch' : 'Add New Branch'}</h6>
                  <button type="button" onClick={() => setEditingBranch(null)} className="btn btn-link text-muted p-0"><X size={16} /></button>
                </div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-bold mb-1">Select Bank *</label>
                    <select 
                      required 
                      value={editingBranch.Bank_ID || ''} 
                      onChange={e => setEditingBranch({...editingBranch, Bank_ID: Number(e.target.value)})}
                      className="form-select"
                    >
                      <option value="">-- Choose a Bank --</option>
                      {data.banks.map(b => <option key={b.Bank_ID} value={b.Bank_ID}>{b.Bank_Name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-7">
                    <label className="form-label small fw-bold mb-1">Branch Name *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><MapPin size={16} /></span>
                      <input 
                        required 
                        value={editingBranch.Branch_Name || ''} 
                        onChange={e => setEditingBranch({...editingBranch, Branch_Name: e.target.value})}
                        className="form-control"
                        placeholder="e.g. Downtown"
                      />
                    </div>
                  </div>
                  <div className="col-md-5">
                    <label className="form-label small fw-bold mb-1">IFSC Code *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><Hash size={16} /></span>
                      <input 
                        required 
                        value={editingBranch.IFSC_Code || ''} 
                        onChange={e => setEditingBranch({...editingBranch, IFSC_Code: e.target.value})}
                        className="form-control"
                        placeholder="e.g. SBIN00..."
                      />
                    </div>
                  </div>
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-success d-inline-flex align-items-center gap-2 px-4 shadow-sm">
                      <Save size={18} /> {editingBranch.Branch_ID ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="table-responsive border rounded-3 overflow-hidden">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3 border-0 py-3">Branch Details</th>
                    <th className="border-0 py-3">IFSC Code</th>
                    <th className="text-end pe-3 border-0 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branches.map(branch => {
                    const bank = data.banks.find(b => Number(b.Bank_ID) === Number(branch.Bank_ID));
                    const deletable = isBranchDeletable(Number(branch.Branch_ID));
                    return (
                      <tr key={branch.Branch_ID}>
                        <td className="ps-3">
                          <div className="fw-bold">{branch.Branch_Name}</div>
                          <div className="small text-muted">{bank?.Bank_Name || 'Unknown'}</div>
                        </td>
                        <td>
                          <code className="bg-light px-2 py-1 rounded text-primary border">{branch.IFSC_Code}</code>
                        </td>
                        <td className="text-end pe-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <button onClick={() => setEditingBranch(branch)} className="btn btn-sm btn-light text-primary border" title="Edit"><Edit2 size={12} /></button>
                            {deletable ? (
                              <button onClick={() => onDeleteBranch(Number(branch.Branch_ID))} className="btn btn-sm btn-light text-danger border" title="Delete"><Trash2 size={12} /></button>
                            ) : (
                              <button className="btn btn-sm btn-light text-muted border opacity-50" disabled title="Locked: This branch is currently assigned to one or more employees"><Lock size={12} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {data.branches.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted small">No branch data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankManagement;
