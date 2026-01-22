
import React, { useState } from 'react';
import { Employee, AppData } from '../types';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  data: AppData;
  onEdit: (emp: Employee) => void;
  onDelete: (id: number) => void;
  onAddNew: () => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, data, onEdit, onDelete, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = employees.filter(emp => 
    `${emp.Employee_Name} ${emp.Employee_Surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.EPIC.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.Mobile.includes(searchTerm)
  );

  return (
    <div className="card shadow-sm border-0 overflow-hidden">
      <div className="card-header bg-white py-4 border-bottom-0">
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted px-3">
                <Search size={18} />
              </span>
              <input 
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search by name, EPIC, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 text-md-end">
            <button onClick={onAddNew} className="btn btn-primary d-inline-flex align-items-center gap-2">
              <Plus size={18} /> Add New Employee
            </button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th className="ps-4">Employee Details</th>
              <th>Dept & Office</th>
              <th>Post & Payscale</th>
              <th>Contact Info</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const dept = data.departments.find(d => d.Department_ID === emp.Department_ID)?.Department_Name;
              const office = data.offices.find(o => o.Office_ID === emp.Office_ID)?.Office_Name;
              const post = data.posts.find(p => p.Post_ID === emp.Post_ID)?.Post_Name;
              const payscale = data.payscales.find(p => p.Pay_ID === emp.Pay_ID)?.Pay_Name;
              
              return (
                <tr key={emp.Employee_ID}>
                  <td className="ps-4">
                    <div className="fw-bold">{emp.Employee_Name} {emp.Employee_Surname}</div>
                    <div className="small text-muted">{emp.Gender} • <span className="text-primary fw-medium">{emp.Service_Type}</span></div>
                    {emp.PwD === 'Yes' && <span className="badge bg-warning-subtle text-warning small mt-1">PwD</span>}
                  </td>
                  <td>
                    <div className="small fw-semibold">{office}</div>
                    <div className="small text-muted">{dept}</div>
                  </td>
                  <td>
                    <div className="mb-1">
                      <span className="badge badge-soft-primary rounded-pill">
                        {post}
                      </span>
                    </div>
                    <div className="small text-muted" style={{fontSize: '0.75rem'}}>{payscale}</div>
                  </td>
                  <td>
                    <div className="small">{emp.Mobile}</div>
                    <div className="small text-muted">EPIC: {emp.EPIC}</div>
                  </td>
                  <td className="text-end pe-4">
                    <div className="btn-group">
                      <button onClick={() => onEdit(emp)} className="btn btn-light btn-sm rounded-3 me-2 text-primary">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDelete(emp.Employee_ID)} className="btn btn-light btn-sm rounded-3 text-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  No employee records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeList;
