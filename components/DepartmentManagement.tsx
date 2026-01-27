
import React, { useState, useMemo } from 'react';
import { Department, AppData } from '../types';
import { Layers, Plus, Save, Trash2, Edit2, X, Lock, Tag, Search, Filter, XCircle } from 'lucide-react';

interface DepartmentManagementProps {
  data: AppData;
  onSaveDepartment: (dept: Department) => void;
  onDeleteDepartment: (deptId: number) => void;
}

const DEPT_TYPES = ['State Govt', 'Central Govt', 'Autonomous', 'Local Body', 'Statutory'];

const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ data, onSaveDepartment, onDeleteDepartment }) => {
  const [editingDept, setEditingDept] = useState<Partial<Department> | null>(null);
  const [deptTypeFilter, setDeptTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Helper to get department type regardless of GSheet header naming (Dept_Type vs Department_Type)
  const getDeptType = (dept: any): string => {
    if (!dept) return '';
    return (dept.Department_Type || dept.Dept_Type || dept.department_type || '').trim();
  };

  // Extract unique types from data to ensure the filter covers everything (including ones not in DEPT_TYPES)
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    data.departments.forEach(d => {
      const type = getDeptType(d);
      if (type) types.add(type);
    });
    // Combine with standard types
    DEPT_TYPES.forEach(t => types.add(t));
    return Array.from(types).sort();
  }, [data.departments]);

  // Filter Logic
  const filteredDepartments = useMemo(() => {
    return data.departments.filter(dept => {
      const matchesType = !deptTypeFilter || getDeptType(dept) === deptTypeFilter;
      const matchesSearch = !searchTerm || 
        dept.Department_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.Department_ID.toString().includes(searchTerm);
      return matchesType && matchesSearch;
    });
  }, [data.departments, deptTypeFilter, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept?.Department_Name?.trim()) {
      // Ensure we save using the standard key 'Department_Type' for the database
      const finalDept = {
        ...editingDept,
        Department_Type: getDeptType(editingDept)
      };
      onSaveDepartment(finalDept as Department);
      setEditingDept(null);
    }
  };

  const isDeletable = (deptId: number) => {
    const hasOffices = data.offices.some(o => Number(o.Department_ID) === deptId);
    const hasEmployees = data.employees.some(e => Number(e.Department_ID) === deptId);
    return !hasOffices && !hasEmployees;
  };

  const clearFilters = () => {
    setDeptTypeFilter('');
    setSearchTerm('');
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
      <div className="card-header bg-white border-bottom py-4 px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-info-subtle p-2 rounded-3 text-info shadow-sm">
              <Layers size={24} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Department Master</h5>
              <p className="text-muted small mb-0">Manage organizational departments and categories</p>
            </div>
          </div>
          {!editingDept && (
            <button onClick={() => setEditingDept({})} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm px-4">
              <Plus size={18} /> Add Department
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="row g-3">
          <div className="col-md-5">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-1" 
                placeholder="Search Department Name or ID..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-white border-end-0 text-muted ps-3">
                <Tag size={16} />
              </span>
              <select 
                className="form-select border-start-0 ps-1 fw-medium" 
                value={deptTypeFilter} 
                onChange={(e) => setDeptTypeFilter(e.target.value)}
              >
                <option value="">All Department Types</option>
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-3">
            <button 
              onClick={clearFilters} 
              className="btn btn-outline-secondary w-100 h-100 d-flex align-items-center justify-content-center gap-2 shadow-sm border-2 fw-semibold"
              disabled={!searchTerm && !deptTypeFilter}
            >
              <XCircle size={18} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-0">
        {editingDept && (
          <div className="bg-light p-4 border-bottom animate-fade-in">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0 text-info d-flex align-items-center gap-2">
                <Filter size={18} />
                {editingDept.Department_ID ? 'Edit Department Details' : 'Register New Department'}
              </h6>
              <button type="button" onClick={() => setEditingDept(null)} className="btn btn-sm btn-link text-muted p-0"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">Department Name *</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><Layers size={16} /></span>
                  <input 
                    required 
                    className="form-control"
                    placeholder="e.g. Information Technology"
                    value={editingDept.Department_Name || ''}
                    onChange={e => setEditingDept({...editingDept, Department_Name: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Department Type</label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><Tag size={16} /></span>
                  <select 
                    className="form-select"
                    value={getDeptType(editingDept)}
                    onChange={e => setEditingDept({...editingDept, Department_Type: e.target.value})}
                  >
                    <option value="">-- Choose Type --</option>
                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm">
                  <Save size={18} /> Save
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4 border-0">ID</th>
                <th className="border-0">Department Name</th>
                <th className="border-0">Type</th>
                <th className="border-0">Linked Units</th>
                <th className="text-end pe-4 border-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map(dept => {
                  const linkedOffices = data.offices.filter(o => Number(o.Department_ID) === Number(dept.Department_ID)).length;
                  const deletable = isDeletable(Number(dept.Department_ID));
                  const dType = getDeptType(dept);

                  return (
                    <tr key={dept.Department_ID}>
                      <td className="ps-4 fw-bold text-muted">#{dept.Department_ID}</td>
                      <td className="fw-semibold text-dark">{dept.Department_Name}</td>
                      <td>
                        {dType ? (
                          <span className="badge bg-info-subtle text-info border border-info-subtle px-3 py-1 fw-medium">
                            {dType}
                          </span>
                        ) : (
                          <span className="text-muted italic small">Uncategorized</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`badge ${linkedOffices > 0 ? 'bg-primary-subtle text-primary' : 'bg-light text-muted border'} rounded-pill px-3`}>
                            {linkedOffices} Offices
                          </span>
                        </div>
                      </td>
                      <td className="text-end pe-4">
                        <div className="d-flex gap-2 justify-content-end">
                          <button onClick={() => setEditingDept(dept)} className="btn btn-light btn-sm rounded-3 border text-primary shadow-sm" title="Edit"><Edit2 size={16} /></button>
                          {deletable ? (
                            <button onClick={() => onDeleteDepartment(Number(dept.Department_ID))} className="btn btn-light btn-sm rounded-3 border text-danger shadow-sm" title="Delete"><Trash2 size={16} /></button>
                          ) : (
                            <button className="btn btn-light btn-sm rounded-3 border text-muted opacity-50" title="Locked: Linked records found" disabled><Lock size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No departments found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer bg-white border-top py-3 px-4">
        <span className="small text-muted">Showing <strong>{filteredDepartments.length}</strong> departments</span>
      </div>
      
      <style>{`
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default DepartmentManagement;
