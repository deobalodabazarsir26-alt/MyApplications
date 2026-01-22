
import React, { useState, useEffect, useMemo } from 'react';
import { AppData, User, UserType, Employee, Office, Bank, BankBranch, Department, Post, Payscale } from './types';
import { INITIAL_DATA } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import EmployeeList from './components/EmployeeList';
import EmployeeForm from './components/EmployeeForm';
import OfficeManagement from './components/OfficeManagement';
import BankManagement from './components/BankManagement';
import UserPostSelection from './components/UserPostSelection';
import { LogOut, User as UserIcon, Building2, Users, PieChart, Landmark, Menu } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('ems_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure userPostSelections exists for older sessions
      if (!parsed.userPostSelections) parsed.userPostSelections = {};
      return parsed;
    }
    return INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    localStorage.setItem('ems_data', JSON.stringify(data));
  }, [data]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.User_Type === UserType.ADMIN) return data.employees;
    
    const userOfficeIds = data.offices
      .filter(o => o.User_ID === currentUser.User_ID)
      .map(o => o.Office_ID);
    
    return data.employees.filter(e => userOfficeIds.includes(e.Office_ID));
  }, [currentUser, data.employees, data.offices]);

  const upsertEmployee = (employee: Employee) => {
    setData(prev => {
      const exists = prev.employees.find(e => e.Employee_ID === employee.Employee_ID);
      const newEmployees = exists
        ? prev.employees.map(e => e.Employee_ID === employee.Employee_ID ? employee : e)
        : [...prev.employees, { ...employee, Employee_ID: Date.now() }];
      return { ...prev, employees: newEmployees };
    });
    setActiveTab('employees');
    setEditingEmployee(null);
  };

  const deleteEmployee = (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setData(prev => ({
        ...prev,
        employees: prev.employees.filter(e => e.Employee_ID !== id)
      }));
    }
  };

  const upsertOffice = (office: Office) => {
    setData(prev => {
      const exists = prev.offices.find(o => o.Office_ID === office.Office_ID);
      const newOffices = exists
        ? prev.offices.map(o => o.Office_ID === office.Office_ID ? office : o)
        : [...prev.offices, { ...office, Office_ID: Date.now() }];
      return { ...prev, offices: newOffices };
    });
  };

  const upsertBank = (bank: Bank) => {
    setData(prev => {
      const exists = prev.banks.find(b => b.Bank_ID === bank.Bank_ID);
      const newBanks = exists
        ? prev.banks.map(b => b.Bank_ID === bank.Bank_ID ? bank : b)
        : [...prev.banks, { ...bank, Bank_ID: Date.now() }];
      return { ...prev, banks: newBanks };
    });
  };

  const upsertBranch = (branch: BankBranch) => {
    setData(prev => {
      const exists = prev.branches.find(b => b.Branch_ID === branch.Branch_ID);
      const newBranches = exists
        ? prev.branches.map(b => b.Branch_ID === branch.Branch_ID ? branch : b)
        : [...prev.branches, { ...branch, Branch_ID: Date.now() }];
      return { ...prev, branches: newBranches };
    });
  };

  const handleTogglePostSelection = (postId: number) => {
    if (!currentUser) return;
    setData(prev => {
      const currentSelections = prev.userPostSelections[currentUser.User_ID] || [];
      const isSelected = currentSelections.includes(postId);
      const newSelections = isSelected 
        ? currentSelections.filter(id => id !== postId)
        : [...currentSelections, postId];
      
      return {
        ...prev,
        userPostSelections: {
          ...prev.userPostSelections,
          [currentUser.User_ID]: newSelections
        }
      };
    });
  };

  if (!currentUser) {
    return <Login users={data.users} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employees={filteredEmployees} data={data} />;
      case 'employees':
        return (
          <EmployeeList 
            employees={filteredEmployees} 
            data={data}
            onEdit={(emp) => {
              setEditingEmployee(emp);
              setActiveTab('employeeForm');
            }}
            onDelete={deleteEmployee}
            onAddNew={() => {
              setEditingEmployee(null);
              setActiveTab('employeeForm');
            }}
          />
        );
      case 'employeeForm':
        return (
          <EmployeeForm 
            employee={editingEmployee} 
            data={data} 
            currentUser={currentUser}
            onSave={upsertEmployee}
            onCancel={() => setActiveTab('employees')}
          />
        );
      case 'offices':
        return <OfficeManagement data={data} onSaveOffice={upsertOffice} />;
      case 'banks':
        return <BankManagement data={data} onSaveBank={upsertBank} onSaveBranch={upsertBranch} />;
      case 'managePosts':
        return (
          <UserPostSelection 
            data={data} 
            currentUser={currentUser} 
            onToggle={handleTogglePostSelection} 
          />
        );
      default:
        return <Dashboard employees={filteredEmployees} data={data} />;
    }
  };

  return (
    <div className="container-fluid p-0 d-flex flex-column flex-md-row min-vh-100">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userType={currentUser.User_Type} 
        onLogout={handleLogout}
        userName={currentUser.User_Name}
      />
      
      <main className="flex-grow-1 bg-light p-3 p-md-5 overflow-auto">
        <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <h1 className="h3 fw-bold mb-1 text-capitalize">
              {activeTab === 'managePosts' ? 'Post Configuration' : activeTab.replace(/([A-Z])/g, ' $1')}
            </h1>
            <p className="text-muted small mb-0">Portal Management & Analytics</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-none d-md-block text-end">
              <div className="fw-semibold small">{currentUser.User_Name}</div>
              <span className={`badge ${currentUser.User_Type === UserType.ADMIN ? 'bg-primary' : 'bg-success'} rounded-pill`} style={{fontSize: '0.65rem'}}>
                {currentUser.User_Type}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-circle p-2">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="container-xl px-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
