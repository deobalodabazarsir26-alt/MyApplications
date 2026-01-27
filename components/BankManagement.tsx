
import React, { useState } from 'react';
import { Bank, BankBranch, AppData } from '../types';
import { Plus, Landmark, Building, Hash, Save, MapPin, Trash2, Edit2, Lock, X, Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ifscService } from '../services/ifscService';

interface BankManagementProps {
  data: AppData;
  onSaveBank: (bank: Bank) => void;
  onDeleteBank: (bankId: number) => void;
  onSaveBranch: (branch: BankBranch) => void;
  onDeleteBranch: (branchId: number) => void;
  onBatchUpdateBranches?: (branches: BankBranch[]) => void;
}

const BankManagement: React.FC<BankManagementProps> = ({ data, onSaveBank, onDeleteBank, onSaveBranch, onDeleteBranch, onBatchUpdateBranches }) => {
  const [editingBank, setEditingBank] = useState<Partial<Bank> | null>(null);
  const [editingBranch, setEditingBranch] = useState<Partial<BankBranch> | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [ifscError, setIfscError] = useState('');

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

  const handleIfscLookup = async (branch?: Partial<BankBranch>) => {
    const target = branch || editingBranch;
    const ifsc = target?.IFSC_Code?.trim();
    if (!ifsc || ifsc.length !== 11) {
      setIfscError('Enter a valid 11-digit IFSC code');
      return;
    }

    setIsFetching(true);
    setIfscError('');
    
    const details = await ifscService.fetchDetails(ifsc);
    
    if (details) {
      if (branch) {
        // Individual row update logic
        const updated = { ...branch, Branch_Name: details.BRANCH } as BankBranch;
        onSaveBranch(updated);
      } else {
        // Editing form update logic
        const existingBank = data.banks.find(b => 
          b.Bank_Name.toLowerCase().includes(details.BANK.toLowerCase()) ||
          details.BANK.toLowerCase().includes(b.Bank_Name.toLowerCase())
        );

        setEditingBranch(prev => ({
          ...prev,
          Branch_Name: details.BRANCH,
          Bank_ID: existingBank ? Number(existingBank.Bank_ID) : prev?.Bank_ID
        }));

        if (!existingBank) {
          setIfscError(`Note: "${details.BANK}" not found in list.`);
        }
      }
    } else {
      setIfscError('IFSC not found');
    }
    setIsFetching(false);
  };

  const handleSyncAllNames = async () => {
    if (!onBatchUpdateBranches) return;
    if (!window.confirm(`This will attempt to update names for all ${data.branches.length} branches based on their IFSC codes. Continue?`)) return;

    setIsSyncingAll(true);
    setSyncProgress({ current: 0, total: data.branches.length });
    
    const updatedBranches: BankBranch[] = [];
    
    for (let i = 0; i < data.branches.length; i++) {
      const branch = data.branches[i];
      setSyncProgress({ current: i + 1, total: data.branches.length });
      
      const details = await ifscService.fetchDetails(branch.IFSC_Code);
      if (details && details.BRANCH) {
        updatedBranches.push({
          ...branch,
          Branch_Name: details.BRANCH
        });
      }
      // Small delay to avoid API rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (updatedBranches.length > 0) {
      onBatchUpdateBranches(updatedBranches);
      alert(`Sync Complete! Successfully updated ${updatedBranches.length} branch names.`);
    } else {
      alert("No updates were found for the current branch list.");
    }
    
    setIsSyncingAll(false);
  };

  const isBankDeletable = (bankId: number) => {
    const bId = Number(bankId);
    const hasBranches = (data.branches || []).some(b => Number(b.Bank_ID) === bId);
    const hasEmployees = (data.employees || []).some(e => Number(e.Bank_ID) === bId);
    return !hasBranches && !hasEmployees;
  };

  const isBranchDeletable = (branchId: number) => {
    const brId = Number(branchId);
    return !(data.employees || []).some(e => Number(e.Branch_ID) === brId);
  };

  return (
    <div className="row g-4">
      {/* BANKS MASTER */}
      <div className="col-lg-4">
        <div className="card shadow-sm border-0 rounded-4 h-100">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary-subtle p-2 rounded-3 text-primary">
                <Landmark size={20} />
              </div>
              <h6 className="mb-0 fw-bold">Banks</h6>
            </div>
            {!editingBank && (
              <button onClick={() => setEditingBank({})} className="btn btn-sm btn-primary rounded-pill px-3">
                <Plus size={14} /> Add
              </button>
            )}
          </div>
          <div className="card-body">
            {editingBank && (
              <form onSubmit={handleBankSubmit} className="mb-4 bg-light p-3 rounded-3 border shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small fw-bold text-muted mb-0">{editingBank.Bank_ID ? 'Update Bank' : 'New Bank'}</label>
                  <button type="button" onClick={() => setEditingBank(null)} className="btn btn-link text-muted p-0"><X size={16} /></button>
                </div>
                <div className="input-group">
                  <input 
                    placeholder="Bank Name..." 
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

            <div className="list-group list-group-flush border rounded-3 overflow-hidden shadow-sm">
              {data.banks.map(bank => {
                const deletable = isBankDeletable(Number(bank.Bank_ID));
                return (
                  <div key={bank.Bank_ID} className="list-group-item d-flex justify-content-between align-items-center py-2">
                    <span className="fw-semibold small">{bank.Bank_Name}</span>
                    <div className="d-flex gap-1">
                      <button onClick={() => setEditingBank(bank)} className="btn btn-xs btn-link text-primary p-1"><Edit2 size={14} /></button>
                      {deletable && <button onClick={() => onDeleteBank(Number(bank.Bank_ID))} className="btn btn-xs btn-link text-danger p-1"><Trash2 size={14} /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BRANCHES MASTER */}
      <div className="col-lg-8">
        <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-success-subtle p-2 rounded-3 text-success">
                  <Building size={20} />
                </div>
                <h6 className="mb-0 fw-bold">Bank Branches</h6>
              </div>
              <div className="d-flex gap-2">
                <button 
                  onClick={handleSyncAllNames} 
                  disabled={isSyncingAll || data.branches.length === 0}
                  className="btn btn-sm btn-outline-info rounded-pill px-3 d-flex align-items-center gap-2"
                >
                  <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} /> 
                  {isSyncingAll ? `Syncing ${syncProgress.current}/${syncProgress.total}...` : 'Sync All Names'}
                </button>
                {!editingBranch && (
                  <button onClick={() => {setEditingBranch({}); setIfscError('');}} className="btn btn-sm btn-success rounded-pill px-3">
                    <Plus size={14} /> New Branch
                  </button>
                )}
              </div>
            </div>

            {isSyncingAll && (
              <div className="progress rounded-pill bg-light" style={{ height: '6px' }}>
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-info" 
                  role="progressbar" 
                  style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
          <div className="card-body">
            {editingBranch && (
              <form onSubmit={handleBranchSubmit} className="p-3 bg-light rounded-3 border mb-4 shadow-sm animate-fade-in">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 small text-uppercase text-success">{editingBranch.Branch_ID ? 'Edit Branch' : 'Add Branch'}</h6>
                  <button type="button" onClick={() => setEditingBranch(null)} className="btn btn-link text-muted p-0"><X size={16} /></button>
                </div>
                
                <div className="row g-2">
                  <div className="col-md-4">
                    <label className="form-label tiny fw-bold text-muted mb-1 text-uppercase">IFSC Code</label>
                    <div className="input-group input-group-sm">
                      <input 
                        required 
                        value={editingBranch.IFSC_Code || ''} 
                        onChange={e => {
                          setEditingBranch({...editingBranch, IFSC_Code: e.target.value.toUpperCase()});
                          setIfscError('');
                        }}
                        className="form-control"
                        placeholder="SBIN00..."
                      />
                      <button type="button" onClick={() => handleIfscLookup()} className="btn btn-success" disabled={isFetching}>
                        {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="col-md-8">
                    <label className="form-label tiny fw-bold text-muted mb-1 text-uppercase">Parent Bank</label>
                    <select 
                      required 
                      value={editingBranch.Bank_ID || ''} 
                      onChange={e => setEditingBranch({...editingBranch, Bank_ID: Number(e.target.value)})}
                      className="form-select form-select-sm"
                    >
                      <option value="">-- Choose Bank --</option>
                      {data.banks.map(b => <option key={b.Bank_ID} value={b.Bank_ID}>{b.Bank_Name}</option>)}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label tiny fw-bold text-muted mb-1 text-uppercase">Branch Name</label>
                    <input 
                      required 
                      value={editingBranch.Branch_Name || ''} 
                      onChange={e => setEditingBranch({...editingBranch, Branch_Name: e.target.value})}
                      className="form-control form-control-sm"
                      placeholder="Enter branch name..."
                    />
                  </div>
                  
                  {ifscError && <div className="col-12 small text-danger mt-1"><AlertCircle size={12} /> {ifscError}</div>}
                  
                  <div className="col-12 text-end mt-2">
                    <button type="submit" className="btn btn-success btn-sm px-4">Save Branch</button>
                  </div>
                </div>
              </form>
            )}

            <div className="table-responsive border rounded-3 overflow-hidden shadow-sm">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th className="ps-3 py-2 border-0">Bank & Branch</th>
                    <th className="py-2 border-0">IFSC Code</th>
                    <th className="text-end pe-3 py-2 border-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branches.map(branch => {
                    const bank = data.banks.find(b => Number(b.Bank_ID) === Number(branch.Bank_ID));
                    const deletable = isBranchDeletable(Number(branch.Branch_ID));
                    return (
                      <tr key={branch.Branch_ID}>
                        <td className="ps-3 py-2">
                          <div className="fw-bold">{branch.Branch_Name}</div>
                          <div className="text-muted tiny">{bank?.Bank_Name || 'Unlinked'}</div>
                        </td>
                        <td className="py-2">
                          <code className="text-primary fw-bold">{branch.IFSC_Code}</code>
                        </td>
                        <td className="text-end pe-3 py-2">
                          <div className="d-flex gap-1 justify-content-end">
                            <button 
                              onClick={() => handleIfscLookup(branch)} 
                              className="btn btn-sm btn-light text-info border p-1" 
                              title="Update Name from Web"
                              disabled={isFetching}
                            >
                              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={() => setEditingBranch(branch)} className="btn btn-sm btn-light text-primary border p-1"><Edit2 size={14} /></button>
                            {deletable && <button onClick={() => onDeleteBranch(Number(branch.Branch_ID))} className="btn btn-sm btn-light text-danger border p-1"><Trash2 size={14} /></button>}
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
      <style>{`
        .tiny { font-size: 0.7rem; }
        .btn-xs { padding: 0.1rem 0.2rem; font-size: 0.75rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default BankManagement;
