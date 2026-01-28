
import React, { useState, useMemo, useEffect } from 'react';
import { Department, AppData } from '../types';
import { Layers, Plus, Save, Trash2, Edit2, X, Lock, Tag, Search, Filter, XCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface DepartmentManagementProps {
  data: AppData;
  onSaveDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: number) => void;
}

const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ data, onSaveDepartment, onDeleteDepartment }) => {
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  
  // Filtering & Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptTypeFilter, setDeptTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Department, direction: 'asc' | 'desc' } | null>({ key: 'Department_Name', direction: 'asc' });

  const getDeptType = (dept: any): string => {
    if (!dept) return '';
    return (dept.Department_Type || dept.Dept_Type || dept.department_type || '').trim();
  };

  const filteredDepartments = useMemo(() => {
    let results = data.departments.filter(dept => {
      const matchesType = !deptTypeFilter || getDeptType(dept) === deptTypeFilter;
      const matchesSearch = !searchTerm || 
        dept.Department_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.Department_ID.toString().includes(searchTerm);
      return matchesType && matchesSearch;
    });

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
  }, [data.departments, deptTypeFilter, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDepartments.slice(start, start + itemsPerPage);
  }, [filteredDepartments, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, deptTypeFilter, itemsPerPage]);

  const requestSort = (key: keyof Department) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Department) => {
    if (sortConfig?.key !== key) return <ChevronDown size={14} className="text-muted opacity-25" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-primary" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept?.Department_Name?.trim()) {
      onSaveDepartment(editingDept as Department);
      setEditingDept(null);
    }
  };

  const isDeletable = (deptId: number) => {
    const hasOffices = data.offices.some(o => Number(o.Department_ID) === deptId);
    return !hasOffices;
  };

  const startIndex = filteredDepartments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredDepartments.length);

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="card-header bg-white border-bottom py-4 px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-info-subtle p-2 rounded-3 text-info"><Layers size={24} /></div>
            <div>
              <h5 className="mb-0 fw-bold">Department Master</h5>
              <p className="text-muted small mb-0">Manage organizations</p>
            </div>
          </div>
          <button onClick={() => setEditingDept({})} className="btn btn-primary px-4 shadow-sm"><Plus size={18} className="me-2" /> Add Dept</button>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 ps-3"><Search size={16} /></span>
              <input type="text" className="form-control border-start-0" placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <button onClick={() => { setSearchTerm(''); setDeptTypeFilter(''); }} className="btn btn-outline-secondary w-100 shadow-sm border-2 fw-semibold">Reset</button>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {editingDept && (
          <div className="bg-light p-4 border-bottom">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Name</label>
                <input required value={editingDept.Department_Name || ''} onChange={e => setEditingDept({...editingDept, Department_Name: e.target.value})} className="form-control" />
              </div>
              <div className="col-md-4 text-end d-flex align-items-end justify-content-end">
                <button type="button" onClick={() => setEditingDept(null)} className="btn btn-light me-2">Cancel</button>
                <button type="submit" className="btn btn-primary px-4"><Save size={18} className="me-2" /> Save</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4 cursor-pointer" onClick={() => requestSort('Department_ID')}>
                  <div className="d-flex align-items-center gap-1">ID {getSortIcon('Department_ID')}</div>
                </th>
                <th className="cursor-pointer" onClick={() => requestSort('Department_Name')}>
                  <div className="d-flex align-items-center gap-1">Department Name {getSortIcon('Department_Name')}</div>
                </th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(dept => (
                <tr key={dept.Department_ID}>
                  <td className="ps-4 text-muted">#{dept.Department_ID}</td>
                  <td className="fw-semibold">{dept.Department_Name}</td>
                  <td className="text-end pe-4">
                    <div className="d-flex gap-2 justify-content-end">
                      <button onClick={() => setEditingDept(dept)} className="btn btn-light btn-sm rounded-3 border text-primary shadow-sm"><Edit2 size={16} /></button>
                      {isDeletable(Number(dept.Department_ID)) ? (
                        <button onClick={() => onDeleteDepartment(Number(dept.Department_ID))} className="btn btn-light btn-sm rounded-3 border text-danger shadow-sm"><Trash2 size={16} /></button>
                      ) : (
                        <button className="btn btn-light btn-sm rounded-3 border text-muted opacity-50" disabled><Lock size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card-footer bg-white border-top py-4 d-flex justify-content-between align-items-center px-4">
        <div className="d-flex align-items-center gap-4">
          <div className="small text-muted">Showing <strong>{startIndex}-{endIndex}</strong> of <strong>{filteredDepartments.length}</strong></div>
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
              <li className="page-item active"><span className="page-link px-3">{currentPage} of {totalPages}</span></li>
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={16} /></button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};

export default DepartmentManagement;
