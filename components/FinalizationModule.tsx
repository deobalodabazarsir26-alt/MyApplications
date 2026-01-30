
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, User, UserType, Employee, Office, Department } from '../types';
import { ShieldCheck, Lock, Unlock, Users, Building2, ChevronRight, Edit3, CheckCircle2, AlertCircle, Info, Loader2, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface FinalizationModuleProps {
  data: AppData;
  currentUser: User;
  onUpdateOffice: (office: Office) => Promise<any>;
  onUpdateOffices: (offices: Office[]) => Promise<any>;
  onEditEmployee: (emp: Employee) => void;
}

const FinalizationModule: React.FC<FinalizationModuleProps> = ({ data, currentUser, onUpdateOffice, onUpdateOffices, onEditEmployee }) => {
  const isAdmin = currentUser.User_Type === UserType.ADMIN;
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Normal User State - Get offices assigned to this user
  const myOffices = useMemo(() => 
    data.offices.filter(o => Math.floor(Number(o.User_ID)) === Math.floor(Number(currentUser.User_ID))),
    [data.offices, currentUser]
  );

  const [selectedOfficeId, setSelectedOfficeId] = useState<number | ''>('');

  useEffect(() => {
    if (myOffices.length > 0 && (selectedOfficeId === '' || !myOffices.some(o => Math.floor(Number(o.Office_ID)) === Math.floor(Number(selectedOfficeId))))) {
      setSelectedOfficeId(Math.floor(Number(myOffices[0].Office_ID)));
    }
  }, [myOffices, selectedOfficeId]);

  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>(
    data.departments.length > 0 ? Math.floor(Number(data.departments[0].Department_ID)) : ''
  );

  const selectedOffice = useMemo(() => {
    if (selectedOfficeId === '') return undefined;
    const idNum = Math.floor(Number(selectedOfficeId));
    return data.offices.find(o => Math.floor(Number(o.Office_ID)) === idNum);
  }, [data.offices, selectedOfficeId]);

  const officeEmployees = useMemo(() => {
    if (selectedOfficeId === '') return [];
    const idNum = Math.floor(Number(selectedOfficeId));
    return data.employees.filter(e => Math.floor(Number(e.Office_ID)) === idNum);
  }, [data.employees, selectedOfficeId]);

  const deptOffices = useMemo(() => {
    if (selectedDeptId === '') return [];
    const idNum = Math.floor(Number(selectedDeptId));
    return data.offices.filter(o => Math.floor(Number(o.Department_ID)) === idNum);
  }, [data.offices, selectedDeptId]);

  // Pagination Logic for Offices (Admin)
  const totalOfficePages = Math.ceil(deptOffices.length / itemsPerPage);
  const paginatedOffices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return deptOffices.slice(start, start + itemsPerPage);
  }, [deptOffices, currentPage]);

  // Pagination Logic for Employees (User)
  const totalEmployeePages = Math.ceil(officeEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return officeEmployees.slice(start, start + itemsPerPage);
  }, [officeEmployees, currentPage]);

  // Reset page when department or office changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeptId, selectedOfficeId]);

  const hasAnyPending = useMemo(() => 
    deptOffices.some(o => o.Finalized?.toString().toLowerCase() !== 'yes'), 
    [deptOffices]
  );
  
  const hasAnyFinalized = useMemo(() => 
    deptOffices.some(o => o.Finalized?.toString().toLowerCase() === 'yes'), 
    [deptOffices]
  );

  const handleToggleFinalization = async (office: Office | undefined) => {
    if (!office || isProcessing) return;
    
    const isFinalized = office.Finalized?.toString().toLowerCase() === 'yes';
    const msg = isFinalized 
      ? `Are you sure you want to RE-OPEN records for "${office.Office_Name} (#${office.Office_ID})"?` 
      : `FINALIZING "${office.Office_Name} (#${office.Office_ID})" will lock all associated employee records for normal users. Continue?`;
    
    if (window.confirm(msg)) {
      setIsProcessing(true);
      try {
        const result = await onUpdateOffice({ 
            ...office, 
            Finalized: isFinalized ? 'No' : 'Yes' 
        });
        if (result && !result.success) throw new Error(result.error || 'Update failed');
      } catch (err: any) {
        console.error('Finalization toggle failed:', err);
        alert(`Finalization failed: ${err.message || 'Unknown network error'}.`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleBatchUpdate = async (targetStatus: 'Yes' | 'No') => {
    const dept = data.departments.find(d => Math.floor(Number(d.Department_ID)) === Math.floor(Number(selectedDeptId)));
    if (!dept || isProcessing || deptOffices.length === 0) return;
    
    const targets = targetStatus === 'Yes' 
      ? deptOffices.filter(o => o.Finalized?.toString().toLowerCase() !== 'yes')
      : deptOffices.filter(o => o.Finalized?.toString().toLowerCase() === 'yes');

    if (targets.length === 0) return;

    if (window.confirm(`${targetStatus === 'Yes' ? 'FINALIZE' : 'DE-FINALIZE'} ${targets.length} offices under ${dept.Department_Name}?`)) {
      setIsProcessing(true);
      try {
        const officesToUpdate = targets.map(o => ({ ...o, Finalized: targetStatus }));
        await onUpdateOffices(officesToUpdate);
        alert(`Successfully ${targetStatus === 'Yes' ? 'finalized' : 'de-finalized'} ${targets.length} offices.`);
      } catch (err: any) {
        console.error('Batch update failed:', err);
        alert(`Batch update failed: ${err.message}.`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const renderPagination = (current: number, total: number) => {
    if (total <= 1) return null;
    return (
      <div className="d-flex justify-content-center mt-4 mb-4">
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${current === 1 ? 'disabled' : ''}`}>
              <button className="page-link shadow-none border-0 bg-white text-primary" onClick={() => setCurrentPage(current - 1)}>
                <ChevronLeft size={18} />
              </button>
            </li>
            {[...Array(total)].map((_, i) => (
              <li key={i} className={`page-item ${current === i + 1 ? 'active' : ''}`}>
                <button className={`page-link shadow-none border-0 rounded-pill mx-1 ${current === i + 1 ? 'bg-primary text-white' : 'bg-white text-primary'}`} onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${current === total ? 'disabled' : ''}`}>
              <button className="page-link shadow-none border-0 bg-white text-primary" onClick={() => setCurrentPage(current + 1)}>
                <ChevronRightIcon size={18} />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  if (isAdmin) {
    return (
      <div className="finalization-admin animate-fade-in d-flex flex-column h-100 position-relative">
        {isProcessing && (
          <div className="processing-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 1000, backdropFilter: 'blur(2px)' }}>
            <div className="card shadow-lg border-0 rounded-4 p-4 text-center">
              <Loader2 size={48} className="text-primary animate-spin mb-3 mx-auto" />
              <h6 className="fw-bold mb-1">Processing Department Data</h6>
              <p className="small text-muted mb-0">Synchronizing records with Google Sheets...</p>
            </div>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="row align-items-center g-3">
              <div className="col-md-5">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary-subtle p-2 rounded-3 text-primary"><ShieldCheck size={24} /></div>
                  <h5 className="mb-0 fw-bold">Admin Controls</h5>
                </div>
              </div>
              <div className="col-md-3">
                <select className="form-select border-primary-subtle" value={selectedDeptId} onChange={e => setSelectedDeptId(Number(e.target.value))}>
                  {data.departments.map(d => <option key={d.Department_ID} value={d.Department_ID}>{d.Department_Name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <div className="d-flex gap-2">
                  <button 
                    onClick={() => handleBatchUpdate('Yes')} 
                    disabled={isProcessing || !hasAnyPending} 
                    className="btn btn-primary flex-grow-1 rounded-pill tiny fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />} 
                    Finalize All
                  </button>
                  <button 
                    onClick={() => handleBatchUpdate('No')} 
                    disabled={isProcessing || !hasAnyFinalized} 
                    className="btn btn-outline-danger flex-grow-1 rounded-pill tiny fw-bold d-flex align-items-center justify-content-center gap-1 shadow-sm"
                  >
                    {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />} 
                    De-Finalize All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row g-4 pb-2">
          {paginatedOffices.map(office => {
            const isLocked = office.Finalized?.toString().toLowerCase() === 'yes';
            return (
              <div key={office.Office_ID} className="col-md-6 col-lg-4">
                <div className={`card h-100 border-0 shadow-sm rounded-4 transition-all ${isLocked ? 'bg-success-subtle' : 'bg-white'}`}>
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className={`p-3 rounded-4 ${isLocked ? 'bg-success text-white' : 'bg-light text-muted'}`}>
                        {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
                      </div>
                      <span className={`badge rounded-pill px-3 py-1 ${isLocked ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {isLocked ? 'Finalized' : 'Pending'}
                      </span>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{office.Office_Name} (#${office.Office_ID})</h6>
                    <button onClick={() => handleToggleFinalization(office)} disabled={isProcessing} className={`btn btn-sm rounded-pill px-4 fw-bold mt-3 ${isLocked ? 'btn-outline-danger' : 'btn-success shadow-sm'}`}>
                      {isLocked ? 'De-Finalize' : 'Finalize'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {renderPagination(currentPage, totalOfficePages)}
      </div>
    );
  }

  const isSelectedOfficeFinalized = selectedOffice?.Finalized?.toString().toLowerCase() === 'yes';

  return (
    <div className="finalization-user animate-fade-in d-flex flex-column h-100 position-relative">
      {isProcessing && (
        <div className="processing-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75" style={{ zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div className="card shadow-lg border-0 rounded-4 p-4 text-center">
            <Loader2 size={48} className="text-primary animate-spin mb-3 mx-auto" />
            <h6 className="fw-bold mb-1">Finalizing Records</h6>
            <p className="small text-muted mb-0">Synchronizing with cloud storage...</p>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary-subtle p-2 rounded-3 text-primary"><ShieldCheck size={24} /></div>
                <div>
                  <h5 className="mb-0 fw-bold">Verification Hub</h5>
                  <p className="tiny text-muted mb-0">Review and secure assigned records</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select border-primary-subtle fw-bold" value={selectedOfficeId} onChange={e => setSelectedOfficeId(Number(e.target.value))}>
                <option value="">-- Choose Office --</option>
                {myOffices.map(o => <option key={o.Office_ID} value={o.Office_ID}>{o.Office_Name}</option>)}
              </select>
            </div>
          </div>
        </div>
        {isSelectedOfficeFinalized && (
          <div className="bg-success text-white px-4 py-2 d-flex align-items-center gap-2 tiny fw-bold animate-pulse">
            <CheckCircle2 size={16} /> DATA SECURED. ALL RECORDS LOCKED.
          </div>
        )}
      </div>

      <div className="row g-4 mb-2">
        {paginatedEmployees.map(emp => (
          <div key={emp.Employee_ID} className="col-12 col-md-6 col-xl-4">
            <div className="card h-100 border-0 shadow-sm rounded-4">
              <div className="card-body p-3">
                <div className="d-flex gap-3">
                  <div className="rounded-4 border overflow-hidden bg-light shadow-sm flex-shrink-0" style={{ width: '80px', height: '110px' }}>
                    {emp.Photo ? <img src={emp.Photo} className="w-100 h-100 object-fit-cover" alt="Profile" /> : <div className="w-100 h-100 d-flex align-items-center justify-content-center text-primary fw-bold">EMP</div>}
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="tiny text-muted">ID: #{emp.Employee_ID}</span>
                      {!isSelectedOfficeFinalized ? <button onClick={() => onEditEmployee(emp)} className="btn btn-xs btn-light border text-primary"><Edit3 size={14} /></button> : <span className="text-success"><Lock size={14} /></span>}
                    </div>
                    <h6 className="fw-bold mb-1 text-truncate">{emp.Employee_Name} {emp.Employee_Surname}</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {renderPagination(currentPage, totalEmployeePages)}

      {selectedOffice && (
        <div className="mt-auto sticky-bottom py-3 bg-light" style={{ zIndex: 10, bottom: '-24px', margin: '0 -24px' }}>
          <div className="card border-0 shadow-lg rounded-4 mx-4 bg-white border border-primary-subtle">
            <div className="card-body p-4 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className={`p-2 rounded-3 ${isSelectedOfficeFinalized ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                  {isProcessing ? <Loader2 size={24} className="animate-spin" /> : (isSelectedOfficeFinalized ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />)}
                </div>
                <div>
                  <div className="fw-bold">Office: {selectedOffice.Office_Name}</div>
                  <div className="small text-muted">{isSelectedOfficeFinalized ? 'Records are locked.' : `Ready to finalize ${officeEmployees.length} records?`}</div>
                </div>
              </div>
              <button onClick={() => handleToggleFinalization(selectedOffice)} disabled={isProcessing} className={`btn btn-lg px-5 rounded-pill shadow-lg d-flex align-items-center gap-2 fw-bold transition-all ${isSelectedOfficeFinalized ? 'btn-outline-success border-2' : 'btn-primary'}`}>
                {isProcessing ? <><Loader2 size={20} className="animate-spin" /> Working...</> : (isSelectedOfficeFinalized ? <><Unlock size={20} /> Re-Open Office</> : <><Lock size={20} /> Finalize Office</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .tiny { font-size: 0.65rem; }
        .object-fit-cover { object-fit: cover; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-pulse { animation: pulse 2s infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sticky-bottom { position: sticky; bottom: -24px; }
        .processing-overlay { cursor: wait; }
        .transition-all { transition: all 0.2s ease; }
        .page-link:hover { background-color: #f1f5f9; }
        .page-item.active .page-link { background-color: #4f46e5 !important; }
      `}</style>
    </div>
  );
};

export default FinalizationModule;
