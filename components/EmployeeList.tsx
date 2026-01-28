
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, AppData, ServiceType, User, UserType, Department } from '../types';
import { Search, Plus, Edit2, Filter, ChevronLeft, ChevronRight, XCircle, Briefcase, AlertTriangle, CheckCircle2, Trash2, Layers, Building2, Tag, Activity, ListOrdered, ChevronUp, ChevronDown } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  data: AppData;
  currentUser: User;
  onEdit: (emp: Employee) => void;
  onAddNew: () => void;
  onDelete: (empId: number) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, data, currentUser, onEdit, onAddNew, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptTypeFilter, setDeptTypeFilter] = useState<string>(''); 
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [officeFilter, setOfficeFilter] = useState<string>('');
  const [postFilter, setPostFilter] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default set to 10
  const [sortConfig, setSortConfig] = useState<{ key: keyof Employee, direction: 'asc' | 'desc' } | null>({ key: 'Employee_Name', direction: 'asc' });

  const isAdmin = currentUser.User_Type === UserType.ADMIN;

  const getDeptType = (dept?: Department): string => {
    if (!dept) return '';
    return (dept.Department_Type || (dept as any).Dept_Type || (dept as any).department_type || '').trim();
  };

  const userRelevantOffices = useMemo(() => {
    if (isAdmin) return data.offices || [];
    return (data.offices || []).filter(o => Number(o.User_ID) === Number(currentUser.User_ID));
  }, [data.offices, currentUser, isAdmin]);

  // Hierarchical Filtering Logic
  const filteredBySearch = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return employees;
    return employees.filter(emp => 
      `${emp.Employee_Name} ${emp.Employee_Surname}`.toLowerCase().includes(term) ||
      emp.EPIC.toLowerCase().includes(term) ||
      emp.Mobile.includes(term)
    );
  }, [employees, searchTerm]);

  const departmentTypes = useMemo(() => {
    if (!isAdmin) return [];
    const types = new Set<string>();
    (data.departments || []).forEach(d => {
      const type = getDeptType(d);
      if (type) types.add(type);
    });
    return Array.from(types).sort();
  }, [data.departments, isAdmin]);

  const filteredByDeptType = useMemo(() => {
    if (!isAdmin || !deptTypeFilter) return filteredBySearch;
    return filteredBySearch.filter(emp => {
      const d = data.departments.find(dept => Number(dept.Department_ID) === Number(emp.Department_ID));
      return getDeptType(d) === deptTypeFilter;
    });
  }, [filteredBySearch, deptTypeFilter, isAdmin, data.departments]);

  const filteredByDept = useMemo(() => {
    if (!deptFilter) return filteredByDeptType;
    return filteredByDeptType.filter(emp => Number(emp.Department_ID) === Number(deptFilter));
  }, [filteredByDeptType, deptFilter]);

  const filteredByOffice = useMemo(() => {
    if (!officeFilter) return filteredByDept;
    return filteredByDept.filter(emp => Number(emp.Office_ID) === Number(officeFilter));
  }, [filteredByDept, officeFilter]);

  // Final filtered list
  const filteredResults = useMemo(() => {
    let results = filteredByOffice.filter(emp => {
      const matchesPost = !postFilter || Number(emp.Post_ID) === Number(postFilter);
      const matchesService = !serviceFilter || emp.Service_Type === serviceFilter;
      const matchesStatus = !statusFilter || emp.Active === statusFilter;
      return matchesPost && matchesService && matchesStatus;
    });

    // Apply Sorting
    if (sortConfig) {
      results = [...results].sort((a, b) => {
        const valA = String(a[sortConfig.key] || '').toLowerCase();
        const valB = String(b[sortConfig.key] || '').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return results;
  }, [filteredByOffice, postFilter, serviceFilter, statusFilter, sortConfig]);

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(start, start + itemsPerPage);
  }, [filteredResults, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, deptTypeFilter, deptFilter, officeFilter, postFilter, serviceFilter, statusFilter, itemsPerPage]);

  const requestSort = (key: keyof Employee) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Employee) => {
    if (sortConfig?.key !== key) return <ChevronDown size={14} className="text-muted opacity-25" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />;
  };

  const clearFilters = () => {
    setSearchTerm(''); setDeptTypeFilter(''); setDeptFilter(''); setOfficeFilter('');
    setPostFilter(''); setServiceFilter(''); setStatusFilter('');
  };

  const startIndex = filteredResults.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredResults.length);

  return (
    <div className="card shadow-sm border-0 rounded-4">
      <div className="card-header bg-white py-4 border-bottom px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <Filter size={20} className="text-primary" />
              Employee Directory
            </h5>
            <p className="text-muted small mb-0 mt-1">
              Active Filters Applied: <span className="fw-bold text-primary">{filteredResults.length}</span> results
            </p>
          </div>
          <button onClick={onAddNew} className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm px-4">
            <Plus size={18} /> Add Record
          </button>
        </div>

        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">
          <div className="col">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted ps-3"><Search size={16} /></span>
              <input type="text" className="form-control border-start-0 ps-1" placeholder="Quick search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          {isAdmin && (
            <div className="col">
              <select className="form-select shadow-sm" value={deptTypeFilter} onChange={(e) => setDeptTypeFilter(e.target.value)}>
                <option value="">All Dept Types</option>
                {departmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          )}
          <div className="col">
            <select className="form-select shadow-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {data.departments.map(dept => <option key={dept.Department_ID} value={dept.Department_ID}>{dept.Department_Name}</option>)}
            </select>
          </div>
          <div className="col">
            <button onClick={clearFilters} className="btn btn-outline-secondary w-100 shadow-sm border-2 fw-semibold" disabled={!searchTerm && !deptTypeFilter && !deptFilter}>
              <XCircle size={18} className="me-2" /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr className="bg-light">
              <th className="ps-4 cursor-pointer" onClick={() => requestSort('Employee_Name')}>
                <div className="d-flex align-items-center gap-1">Employee Details {getSortIcon('Employee_Name')}</div>
              </th>
              <th className="cursor-pointer" onClick={() => requestSort('Active')}>
                <div className="d-flex align-items-center gap-1">Status {getSortIcon('Active')}</div>
              </th>
              <th className="cursor-pointer" onClick={() => requestSort('Office_ID')}>
                <div className="d-flex align-items-center gap-1">Location {getSortIcon('Office_ID')}</div>
              </th>
              <th>Designation</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((emp) => {
              const office = data.offices.find(o => Number(o.Office_ID) === Number(emp.Office_ID))?.Office_Name;
              const post = data.posts.find(p => Number(p.Post_ID) === Number(emp.Post_ID))?.Post_Name;
              const isActive = emp.Active !== 'No';

              return (
                <tr key={emp.Employee_ID}>
                  <td className="ps-4">
                    <div className="fw-bold text-dark">{emp.Employee_Name} {emp.Employee_Surname}</div>
                    <div className="small text-muted">{emp.Gender} • {emp.Service_Type}</div>
                  </td>
                  <td>
                    {isActive ? (
                      <span className="badge bg-success-subtle text-success rounded-pill px-3">Active</span>
                    ) : (
                      <span className="badge bg-danger-subtle text-danger rounded-pill px-3">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="small fw-semibold">{office}</div>
                    <div className="tiny text-muted uppercase">ID: #{emp.Office_ID}</div>
                  </td>
                  <td><span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2">{post}</span></td>
                  <td className="text-end pe-4">
                    <div className="d-flex gap-2 justify-content-end">
                      <button onClick={() => onEdit(emp)} className="btn btn-light btn-sm rounded-3 text-primary border shadow-sm"><Edit2 size={16} /></button>
                      {isAdmin && <button onClick={() => onDelete(emp.Employee_ID)} className="btn btn-outline-danger btn-sm rounded-3 shadow-sm"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginatedItems.length === 0 && (
              <tr><td colSpan={5} className="text-center py-5 text-muted">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card-footer bg-white py-4 border-top d-flex justify-content-between align-items-center px-4">
        <div className="d-flex align-items-center gap-4">
          <div className="small text-muted">
            Showing <strong>{startIndex}-{endIndex}</strong> of <strong>{filteredResults.length}</strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">Per page:</span>
            <select className="form-select form-select-sm" style={{width: '80px'}} value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={16} /></button>
              </li>
              <li className="page-item active">
                <span className="page-link px-3">{currentPage} of {totalPages}</span>
              </li>
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
              </li>
            </ul>
          </nav>
        )}
      </div>
      <style>{`
        .cursor-pointer { cursor: pointer; user-select: none; }
        .cursor-pointer:hover { background-color: #f8fafc; }
        .tiny { font-size: 0.65rem; letter-spacing: 0.025em; font-weight: 700; }
      `}</style>
    </div>
  );
};

export default EmployeeList;
