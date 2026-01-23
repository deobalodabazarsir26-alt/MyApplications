
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, User, UserType, Employee, Office, Bank, BankBranch, Department, Post, Payscale } from './types';
import { INITIAL_DATA, GSHEET_API_URL } from './constants';
import { syncService } from './services/googleSheetService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import OfficeManagement from './components/OfficeManagement';
import BankManagement from './components/BankManagement';
import UserPostSelection from './components/UserPostSelection';
import UserManagement from './components/UserManagement';
import DepartmentManagement from './components/DepartmentManagement';
import ServiceMasterManagement from './components/ServiceMasterManagement';
import { LogOut, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('ems_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.User_ID !== undefined) {
          parsed.User_ID = Number(parsed.User_ID);
        }
        return parsed;
      }
    } catch (e) {}
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);

  const [data, setData] = useState<AppData>(() => {
    try {
      const savedData = localStorage.getItem('ems_data');
      if (savedData) {
        return { ...INITIAL_DATA, ...JSON.parse(savedData) };
      }
    } catch (e) {}
    return INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const remoteData = await syncService.fetchAllData();
      if (remoteData) {
        const sanitizeTable = (table: any[]) => {
          if (!Array.isArray(table)) return [];
          return table.map(item => {
            const newItem = { ...item };
            Object.keys(newItem).forEach(key => {
              const k = key.toLowerCase();
              if (k.endsWith('_id') || k === 'ac_no' || k === 'bank_id' || k === 'user_id' || k === 'post_id' || k === 'pay_id' || k === 'department_id' || k === 'office_id' || k === 'branch_id' || k === 'employee_id') {
                if (newItem[key] !== undefined && newItem[key] !== null && newItem[key] !== '') {
                  newItem[key] = Number(newItem[key]);
                }
              }
            });
            return newItem;
          });
        };

        const sanitizedData: any = { ...remoteData };
        sanitizedData.users = sanitizeTable(remoteData.users || []);
        sanitizedData.departments = sanitizeTable(remoteData.departments || []);
        sanitizedData.offices = sanitizeTable(remoteData.offices || []);
        sanitizedData.banks = sanitizeTable(remoteData.banks || []);
        const rawBranches = remoteData.branches || (remoteData as any).bank_branchs || [];
        sanitizedData.branches = sanitizeTable(rawBranches);
        sanitizedData.posts = sanitizeTable(remoteData.posts || []);
        sanitizedData.payscales = sanitizeTable(remoteData.payscales || []);
        sanitizedData.employees = sanitizeTable(remoteData.employees || []);

        const rawSelections = (remoteData.userPostSelections || {}) as Record<string, any>;
        const sanitizedSelections: Record<number, number[]> = {};
        
        Object.keys(rawSelections).forEach(key => {
          const numericKey = Number(key);
          if (!isNaN(numericKey)) {
            const val = rawSelections[key];
            sanitizedSelections[numericKey] = Array.isArray(val) 
              ? val.map(v => Number(v)).filter(v => !isNaN(v)) 
              : [];
          }
        });

        const mergedData = { 
          ...INITIAL_DATA, 
          ...sanitizedData,
          userPostSelections: sanitizedSelections
        };
        
        setData(mergedData);
        try {
          localStorage.setItem('ems_data', JSON.stringify(mergedData));
        } catch (e) {}
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('ems_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('ems_user');
      }
    } catch (e) {}
  }, [currentUser]);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    const employees = data.employees || [];
    if (currentUser.User_Type === UserType.ADMIN) return employees;
    const userOfficeIds = (data.offices || [])
      .filter(o => Number(o.User_ID) === Number(currentUser.User_ID))
      .map(o => Number(o.Office_ID));
    return employees.filter(e => userOfficeIds.includes(Number(e.Office_ID)));
  }, [currentUser, data.employees, data.offices]);

  const performSync = async (action: string, payload: any, newState: AppData) => {
    setData(newState);
    setIsSyncing(true);
    setSyncError(false);
    
    try {
      localStorage.setItem('ems_data', JSON.stringify(newState));
    } catch (e) {}

    const success = await syncService.saveData(action, payload);
    if (!success) {
      setSyncError(true);
    }
    setIsSyncing(false);
  };

  // Master Data Handlers
  const upsertUser = (user: User) => {
    const users = data.users || [];
    const exists = users.find(u => Number(u.User_ID) === Number(user.User_ID));
    const newUser = exists ? user : { ...user, User_ID: Date.now() };
    const newUsers = exists 
      ? users.map(u => Number(u.User_ID) === Number(user.User_ID) ? user : u)
      : [...users, newUser];
    performSync('upsertUser', newUser, { ...data, users: newUsers });
  };

  const deleteUser = (userId: number) => {
    const hasOffices = data.offices.some(o => Number(o.User_ID) === userId);
    if (hasOffices) {
      alert("Cannot delete user: This user is assigned as custodian for one or more offices.");
      return;
    }
    const newUsers = data.users.filter(u => Number(u.User_ID) !== userId);
    performSync('deleteUser', { User_ID: userId }, { ...data, users: newUsers });
  };

  const upsertDepartment = (dept: Department) => {
    const depts = data.departments || [];
    const exists = depts.find(d => Number(d.Department_ID) === Number(dept.Department_ID));
    const newDept = exists ? dept : { ...dept, Department_ID: Date.now() };
    const newDepts = exists
      ? depts.map(d => Number(d.Department_ID) === Number(dept.Department_ID) ? dept : d)
      : [...depts, newDept];
    performSync('upsertDepartment', newDept, { ...data, departments: newDepts });
  };

  const deleteDepartment = (deptId: number) => {
    const hasOffices = data.offices.some(o => Number(o.Department_ID) === deptId);
    const hasEmployees = data.employees.some(e => Number(e.Department_ID) === deptId);
    if (hasOffices || hasEmployees) {
      alert("Cannot delete department: There are active offices or employees linked to this department.");
      return;
    }
    const newDepts = data.departments.filter(d => Number(d.Department_ID) !== deptId);
    performSync('deleteDepartment', { Department_ID: deptId }, { ...data, departments: newDepts });
  };

  const upsertEmployee = (employee: Employee) => {
    const employees = data.employees || [];
    const exists = employees.find(e => Number(e.Employee_ID) === Number(employee.Employee_ID));
    const newEmp = exists ? employee : { ...employee, Employee_ID: Number(employee.Employee_ID) || Date.now() };
    const newEmployees = exists
      ? employees.map(e => Number(e.Employee_ID) === Number(employee.Employee_ID) ? employee : e)
      : [...employees, newEmp];
    
    const newState = { ...data, employees: newEmployees };
    performSync('upsertEmployee', newEmp, newState);
    setActiveTab('employees');
    setEditingEmployee(null);
  };

  const deleteEmployee = (empId: number) => {
    const newEmployees = data.employees.filter(e => Number(e.Employee_ID) !== empId);
    performSync('deleteEmployee', { Employee_ID: empId }, { ...data, employees: newEmployees });
  };

  const upsertOffice = (office: Office) => {
    const offices = data.offices || [];
    const exists = offices.find(o => Number(o.Office_ID) === Number(office.Office_ID));
    const newOff = exists ? office : { ...office, Office_ID: Date.now() };
    const newOffices = exists
      ? offices.map(o => Number(o.Office_ID) === Number(office.Office_ID) ? office : o)
      : [...offices, newOff];
    
    performSync('upsertOffice', newOff, { ...data, offices: newOffices });
  };

  const deleteOffice = (officeId: number) => {
    const hasEmployees = data.employees.some(e => Number(e.Office_ID) === officeId);
    if (hasEmployees) {
      alert("Cannot delete office: There are active employees assigned to this office.");
      return;
    }
    const newOffices = data.offices.filter(o => Number(o.Office_ID) !== officeId);
    performSync('deleteOffice', { Office_ID: officeId }, { ...data, offices: newOffices });
  };

  const upsertBank = (bank: Bank) => {
    const banks = data.banks || [];
    const exists = banks.find(b => Number(b.Bank_ID) === Number(bank.Bank_ID));
    const newBk = exists ? bank : { ...bank, Bank_ID: Date.now() };
    const newBanks = exists
      ? banks.map(b => Number(b.Bank_ID) === Number(bank.Bank_ID) ? bank : b)
      : [...banks, newBk];
    
    performSync('upsertBank', newBk, { ...data, banks: newBanks });
  };

  const deleteBank = (bankId: number) => {
    const hasBranches = data.branches.some(b => Number(b.Bank_ID) === bankId);
    const hasEmployees = data.employees.some(e => Number(e.Bank_ID) === bankId);
    if (hasBranches || hasEmployees) {
      alert("Cannot delete bank: There are active branches or employee records linked to this bank.");
      return;
    }
    const newBanks = data.banks.filter(b => Number(b.Bank_ID) !== bankId);
    performSync('deleteBank', { Bank_ID: bankId }, { ...data, banks: newBanks });
  };

  const upsertBranch = (branch: BankBranch) => {
    const branches = data.branches || [];
    const exists = branches.find(b => Number(b.Branch_ID) === Number(branch.Branch_ID));
    const newBr = exists ? branch : { ...branch, Branch_ID: Date.now() };
    const newBranches = exists
      ? branches.map(b => Number(b.Branch_ID) === Number(branch.Branch_ID) ? branch : b)
      : [...branches, newBr];
    
    performSync('upsertBranch', newBr, { ...data, branches: newBranches });
  };

  const deleteBranch = (branchId: number) => {
    const hasEmployees = data.employees.some(e => Number(e.Branch_ID) === branchId);
    if (hasEmployees) {
      alert("Cannot delete branch: This branch is currently assigned to one or more employees.");
      return;
    }
    const newBranches = data.branches.filter(b => Number(b.Branch_ID) !== branchId);
    performSync('deleteBranch', { Branch_ID: branchId }, { ...data, branches: newBranches });
  };

  const upsertPost = (post: Post) => {
    const posts = data.posts || [];
    const exists = posts.find(p => Number(p.Post_ID) === Number(post.Post_ID));
    const newPost = exists ? post : { ...post, Post_ID: Date.now() };
    const newPosts = exists
      ? posts.map(p => Number(p.Post_ID) === Number(post.Post_ID) ? post : p)
      : [...posts, newPost];
    performSync('upsertPost', newPost, { ...data, posts: newPosts });
  };

  const deletePost = (postId: number) => {
    const hasEmployees = data.employees.some(e => Number(e.Post_ID) === postId);
    if (hasEmployees) {
      alert("Cannot delete post: This designation is currently assigned to employees.");
      return;
    }
    const newPosts = data.posts.filter(p => Number(p.Post_ID) !== postId);
    performSync('deletePost', { Post_ID: postId }, { ...data, posts: newPosts });
  };

  const upsertPayscale = (payscale: Payscale) => {
    const scales = data.payscales || [];
    const exists = scales.find(s => Number(s.Pay_ID) === Number(payscale.Pay_ID));
    const newScale = exists ? payscale : { ...payscale, Pay_ID: Date.now() };
    const newScales = exists
      ? scales.map(s => Number(s.Pay_ID) === Number(payscale.Pay_ID) ? payscale : s)
      : [...scales, newScale];
    performSync('upsertPayscale', newScale, { ...data, payscales: newScales });
  };

  const deletePayscale = (payId: number) => {
    const hasEmployees = data.employees.some(e => Number(e.Pay_ID) === payId);
    if (hasEmployees) {
      alert("Cannot delete payscale: This scale is currently assigned to employees.");
      return;
    }
    const newScales = data.payscales.filter(s => Number(s.Pay_ID) !== payId);
    performSync('deletePayscale', { Pay_ID: payId }, { ...data, payscales: newScales });
  };

  const handleTogglePostSelection = (postId: number) => {
    if (!currentUser) return;
    const selections = data.userPostSelections || {};
    const userId = Number(currentUser.User_ID);
    const rawSelections = selections[userId];
    const currentSelections = Array.isArray(rawSelections) ? rawSelections : [];
    
    const isSelected = currentSelections.includes(Number(postId));
    const newSelections = isSelected 
      ? currentSelections.filter(id => Number(id) !== Number(postId))
      : [...currentSelections, Number(postId)];
    
    const newState = {
      ...data,
      userPostSelections: { ...selections, [userId]: newSelections }
    };
    performSync('updatePostSelections', { User_ID: userId, Post_IDs: newSelections }, newState);
  };

  const handleLogin = (user: User) => {
    const sanitizedUser = { ...user, User_ID: Number(user.User_ID) };
    setCurrentUser(sanitizedUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  if (!currentUser) {
    return <Login users={data.users || []} onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <RefreshCw size={48} className="text-primary mb-3 spin-animate" />
        <h5 className="fw-bold">Synchronizing with Cloud...</h5>
        <p className="text-muted small">Loading Core System Configs & Records</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} data={data} />;
      case 'employees': return <EmployeeList employees={filteredEmployees} data={data} currentUser={currentUser} onEdit={(emp) => { setEditingEmployee(emp); setActiveTab('employeeForm'); }} onAddNew={() => { setEditingEmployee(null); setActiveTab('employeeForm'); }} onDelete={deleteEmployee} />;
      case 'employeeForm': return <EmployeeForm employee={editingEmployee} data={data} currentUser={currentUser} onSave={upsertEmployee} onCancel={() => setActiveTab('employees')} />;
      case 'users': return <UserManagement data={data} onSaveUser={upsertUser} onDeleteUser={deleteUser} />;
      case 'offices': return <OfficeManagement data={data} onSaveOffice={upsertOffice} onDeleteOffice={deleteOffice} />;
      case 'departments': return <DepartmentManagement data={data} onSaveDepartment={upsertDepartment} onDeleteDepartment={deleteDepartment} />;
      case 'banks': return <BankManagement data={data} onSaveBank={upsertBank} onDeleteBank={deleteBank} onSaveBranch={upsertBranch} onDeleteBranch={deleteBranch} />;
      case 'serviceMaster': return <ServiceMasterManagement data={data} onSavePost={upsertPost} onDeletePost={deletePost} onSavePayscale={upsertPayscale} onDeletePayscale={deletePayscale} />;
      case 'managePosts': return <UserPostSelection data={data} currentUser={currentUser} onToggle={handleTogglePostSelection} />;
      default: return <Dashboard employees={filteredEmployees} data={data} />;
    }
  };

  return (
    <div className="container-fluid p-0 d-flex flex-column flex-md-row min-vh-100">
      <Sidebar data={data} activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="flex-grow-1 bg-light p-3 p-md-5 overflow-auto">
        <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <h1 className="h3 fw-bold mb-1 text-capitalize">
              {activeTab === 'managePosts' ? 'Configuration' : activeTab.replace(/([A-Z])/g, ' $1')}
            </h1>
            <div className="d-flex align-items-center gap-2">
              <p className="text-muted small mb-0">Google Sheets Live Sync</p>
              {!GSHEET_API_URL && <span className="badge bg-warning text-dark" style={{fontSize: '0.6rem'}}>OFFLINE MODE</span>}
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {GSHEET_API_URL && (
              <div className="d-flex align-items-center gap-1 me-2 px-2 py-1 bg-white rounded-pill border small">
                {isSyncing ? (
                  <RefreshCw size={12} className="text-primary spin-animate" />
                ) : syncError ? (
                  <AlertCircle size={12} className="text-danger" />
                ) : (
                  <CheckCircle size={12} className="text-success" />
                )}
                <span className="text-muted" style={{fontSize: '0.7rem'}}>
                  {isSyncing ? 'Syncing...' : syncError ? 'Sync Failed' : 'Database Online'}
                </span>
              </div>
            )}
            <div className="d-none d-md-block text-end">
              <div className="fw-semibold small">{currentUser.User_Name}</div>
              <span className={`badge ${currentUser.User_Type === UserType.ADMIN ? 'bg-primary' : 'bg-success'} rounded-pill`} style={{fontSize: '0.65rem'}}>
                {currentUser.User_Type}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-circle p-2 shadow-sm">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="container-xl px-0">
          {renderContent()}
        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-animate { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
