
import React, { useState, useMemo } from 'react';
import { Bank, BankBranch, AppData } from '../types';
import { Plus, Landmark, Building, Hash, Save, MapPin, Trash2, Edit2, Lock, X, Search, Loader2, AlertCircle, RefreshCw, ChevronRight, ListFilter } from 'lucide-react';
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
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [editingBank, setEditingBank] = useState<Partial<Bank> | null>(null);
  const [editingBranch, setEditingBranch] = useState<Partial<BankBranch> | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [ifscError, setIfscError] = useState('');

  const filteredBranches = useMemo(() => {
    if (selectedBankId === null) return data.branches;
    return data.branches.filter(b => Number(b.Bank_ID) === selectedBankId);
  }, [data.branches, selectedBankId]);

  const selectedBank = useMemo(() => 
    data.banks.find(b => Number(b.Bank_ID) === selectedBankId), 
    [data.banks, selectedBankId]
  );

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
        const updated = { ...branch, Branch_Name: details.BRANCH } as BankBranch;
        onSaveBranch(updated);
      } else {
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

  const handleSyncFilteredNames = async () => {
    if (!onBatchUpdateBranches) return;
    const count = filteredBranches.length;
    if (count === 0) return;

    const msg = selectedBankId 
      ? `Update all ${count} branches for ${selectedBank?.Bank_Name}?` 
      : `Update all ${count} branches across all banks?`;

    if (!window.confirm(msg)) return;

    setIsSyncingAll(true);
    setSyncProgress({ current: 0, total: count });
    
    const updatedBranches: BankBranch[] = [];
    
    for (let i = 0; i < filteredBranches.length; i++) {
      const branch = filteredBranches[i];
      setSyncProgress({ current: i + 1, total: count });
      
      const details = await ifscService.fetchDetails(branch.IFSC_Code);
      if (details && details.BRANCH) {
        updatedBranches.push({
          ...branch,
          Branch_Name: details.BRANCH
        });
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (updatedBranches.length > 0) {
      onBatchUpdateBranches(updatedBranches);
    }
    setIsSyncingAll(false);
  };

  const isBankDeletable = (bankId: number) => {
    const bId = Number(bankId);
    return !data.branches.some(b => Number(b.Bank_ID) === bId) && 
           !data.employees.some(e => Number(e.Bank_ID) === bId);
  };

  const isBranchDeletable = (branchId: number) => {
    return !data.employees.some(e => Number(e.Branch_ID) === Number(branchId));
  };

  return (
    <div className="row g-4">
      {/* LEFT: BANK NAVIGATOR */}
      <div className="col-lg-4">
        <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2 text-primary">
              <Landmark size={20} />
              <h6 className="mb-0 fw-bold">Banks</h6>
            </div>
            <button onClick={() => setEditingBank({})} className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="card-body p-0">
            {editingBank && (
              <div className="p-3 bg-light border-bottom animate-fade-in">
                <form onSubmit={handleBankSubmit}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="tiny fw-bold text-muted text-uppercase">Bank Name</label>
                    <button type="button" onClick={() => setEditingBank(null)} className="btn btn-link p-0 text-muted"><X size={14} /></button>
                  </div>
                  <div className="input-group input-group-sm">
                    <input autoFocus required className="form-control" placeholder="Full Bank Name" value={editingBank.Bank_Name || ''} onChange={e => setEditingBank({...editingBank, Bank_Name: e.target.value})} />
                    <button type="submit" className="btn btn-primary"><Save size={14} /></button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="list-group list-group-flush">
              <button 
                onClick={() => setSelectedBankId(null)}
                className={`list-group-item list-group-item-action border-0 d-flex align-items-center justify-content-between py-3 px-4 ${selectedBankId === null ? 'bg-primary-subtle text-primary border-start border-4 border-primary' : ''}`}
              >
                <div className="d-flex align-items-center gap-3">
                  <ListFilter size={18} />
                  <span className="fw-bold">All Branches</span>
                </div>
                <span className="badge bg-white text-dark border rounded-pill small">{data.branches.length}</span>
              </button>

              {data.banks.map(bank => {
                const isActive = selectedBankId === Number(bank.Bank_ID);
                const branchCount = data.branches.filter(b => Number(b.Bank_ID) === Number(bank.Bank_ID)).length;
                return (
                  <div key={bank.Bank_ID} className={`list-group-item list-group-item-action border-0 p-0 ${isActive ? 'bg-primary-subtle border-start border-4 border-primary' : ''}`}>
                    <div className="d-flex align-items-center p-3 ps-4 gap-3">
                      <div className={`p-2 rounded-circle ${isActive ? 'bg-primary text-white' : 'bg-light text-muted'}`}>
                        <Landmark size={14} />
                      </div>
                      <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => setSelectedBankId(Number(bank.Bank_ID))}>
                        <div className={`fw-bold small mb-0 ${isActive ? 'text-primary' : 'text-dark'}`}>{bank.Bank_Name}</div>
                        <div className="tiny text-muted">{branchCount} Branches Registered</div>
                      </div>
                      <div className="d-flex gap-1">
                        <button onClick={() => setEditingBank(bank)} className="btn btn-xs btn-outline-secondary border-0 p-1"><Edit2 size={12} /></button>
                        {isBankDeletable(Number(bank.Bank_ID)) && (
                          <button onClick={() => onDeleteBank(Number(bank.Bank_ID))} className="btn btn-xs btn-outline-danger border-0 p-1"><Trash2 size={12} /></button>
                        )}
                        <button onClick={() => setSelectedBankId(Number(bank.Bank_ID))} className={`btn btn-xs border-0 p-1 ${isActive ? 'text-primary' : 'text-muted'}`}>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: CONTEXTUAL BRANCH MANAGER */}
      <div className="col-lg-8">
        <div className="card shadow-sm border-0 rounded-4 h-100 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="d-flex align-items-center gap-2 text-success">
                  <Building size={20} />
                  <h6 className="mb-0 fw-bold">
                    {selectedBank ? `${selectedBank.Bank_Name} Branches` : 'Global Branch Directory'}
                  </h6>
                </div>
                <p className="tiny text-muted mb-0 mt-1">
                  {selectedBank ? `Managing locations for ${selectedBank.Bank_Name}` : 'Viewing all registered branch locations'}
                </p>
              </div>
              <div className="d-flex gap-2">
                <button 
                  onClick={handleSyncFilteredNames} 
                  disabled={isSyncingAll || filteredBranches.length === 0}
                  className="btn btn-sm btn-outline-info rounded-pill px-3 d-flex align-items-center gap-2"
                >
                  <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} /> 
                  {isSyncingAll ? `Syncing ${syncProgress.current}/${syncProgress.total}...` : 'Sync Visible'}
                </button>
                <button onClick={() => {setEditingBranch({ Bank_ID: selectedBankId || undefined }); setIfscError('');}} className="btn btn-sm btn-success rounded-pill px-3 shadow-sm">
                  <Plus size={14} /> New Branch
                </button>
              </div>
            </div>
            {isSyncingAll && (
              <div className="progress mt-3 rounded-pill bg-light" style={{ height: '4px' }}>
                <div className="progress-bar bg-info" style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}></div>
              </div>
            )}
          </div>

          <div className="card-body">
            {editingBranch && (
              <div className="p-4 bg-light rounded-4 border mb-4 animate-fade-in shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 small text-uppercase text-success">{editingBranch.Branch_ID ? 'Update Branch Record' : 'Add New Branch Location'}</h6>
                  <button onClick={() => setEditingBranch(null)} className="btn btn-link text-muted p-0"><X size={18} /></button>
                </div>
                <form onSubmit={handleBranchSubmit} className="row g-3">
                  <div className="col-md-4">
                    <label className="tiny fw-bold text-muted text-uppercase mb-1 d-block">IFSC Code</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0"><Hash size={14} /></span>
                      <input required className="form-control border-start-0 ps-1" value={editingBranch.IFSC_Code || ''} onChange={e => setEditingBranch({...editingBranch, IFSC_Code: e.target.value.toUpperCase()})} placeholder="SBIN00..." />
                      <button type="button" onClick={() => handleIfscLookup()} className="btn btn-success" disabled={isFetching}>
                        {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <label className="tiny fw-bold text-muted text-uppercase mb-1 d-block">Parent Bank</label>
                    <select required className="form-select form-select-sm" value={editingBranch.Bank_ID || ''} onChange={e => setEditingBranch({...editingBranch, Bank_ID: Number(e.target.value)})}>
                      <option value="">-- Choose Target Bank --</option>
                      {data.banks.map(b => <option key={b.Bank_ID} value={b.Bank_ID}>{b.Bank_Name}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="tiny fw-bold text-muted text-uppercase mb-1 d-block">Branch Location Name</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0"><MapPin size={14} /></span>
                      <input required className="form-control border-start-0 ps-1" value={editingBranch.Branch_Name || ''} onChange={e => setEditingBranch({...editingBranch, Branch_Name: e.target.value})} placeholder="Main Branch / MG Road..." />
                    </div>
                  </div>
                  {ifscError && <div className="col-12 tiny text-danger"><AlertCircle size={12} /> {ifscError}</div>}
                  <div className="col-12 text-end">
                    <button type="submit" className="btn btn-success btn-sm px-4 rounded-pill shadow-sm">
                      <Save size={14} className="me-2" /> {editingBranch.Branch_ID ? 'Update Changes' : 'Register Branch'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-responsive rounded-3 border">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="tiny text-uppercase tracking-wider">
                    <th className="ps-3 py-3 border-0">Branch / Bank</th>
                    <th className="py-3 border-0">IFSC Code</th>
                    <th className="text-end pe-3 py-3 border-0">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map(branch => {
                    const bank = data.banks.find(b => Number(b.Bank_ID) === Number(branch.Bank_ID));
                    const deletable = isBranchDeletable(Number(branch.Branch_ID));
                    return (
                      <tr key={branch.Branch_ID}>
                        <td className="ps-3 py-3">
                          <div className="fw-bold text-dark small">{branch.Branch_Name}</div>
                          {selectedBankId === null && <div className="tiny text-muted">{bank?.Bank_Name || 'Unlinked Bank'}</div>}
                        </td>
                        <td className="py-3">
                          <code className="bg-light px-2 py-1 rounded text-primary border border-primary-subtle tiny fw-bold">{branch.IFSC_Code}</code>
                        </td>
                        <td className="text-end pe-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <button onClick={() => handleIfscLookup(branch)} className="btn btn-xs btn-light text-info border p-1" title="Sync with Web"><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /></button>
                            <button onClick={() => setEditingBranch(branch)} className="btn btn-xs btn-light text-primary border p-1" title="Edit"><Edit2 size={14} /></button>
                            {deletable ? (
                              <button onClick={() => onDeleteBranch(Number(branch.Branch_ID))} className="btn btn-xs btn-light text-danger border p-1" title="Delete"><Trash2 size={14} /></button>
                            ) : (
                              <div className="btn btn-xs btn-light text-muted border p-1 opacity-50" title="Locked: Active Employee records detected"><Lock size={14} /></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBranches.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5">
                        <div className="mb-3 text-muted opacity-25"><Building size={48} /></div>
                        <p className="text-muted small">No branch locations found for this selection.</p>
                        <button onClick={() => setEditingBranch({ Bank_ID: selectedBankId || undefined })} className="btn btn-sm btn-link text-success text-decoration-none fw-bold">
                          Add the first branch now
                        </button>
                      </td>
                    </tr>
                  )}
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
