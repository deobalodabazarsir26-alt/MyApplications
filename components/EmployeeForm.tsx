
import React, { useState, useEffect } from 'react';
import { Employee, AppData, ServiceType, User, UserType } from '../types';
import { Save, X, Info, User as UserIcon, Briefcase, Landmark, AlertCircle, Hash, Activity, Search, Loader2 } from 'lucide-react';
import { ifscService } from '../services/ifscService';

interface EmployeeFormProps {
  employee: Employee | null;
  data: AppData;
  currentUser: User;
  onSave: (emp: Employee) => void;
  onCancel: () => void;
}

const DEACTIVATION_REASONS = ['Transfer', 'Death', 'Resign', 'Debarred'];

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, data, currentUser, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Employee>>(employee || {
    Gender: 'Male',
    PwD: 'No',
    Service_Type: ServiceType.REGULAR,
    Active: 'Yes',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isVerifyingIfsc, setIsVerifyingIfsc] = useState(false);
  const [availableOffices, setAvailableOffices] = useState(data.offices || []);
  const [availableBranches, setAvailableBranches] = useState(() => {
    if (employee && employee.Bank_ID !== undefined && employee.Bank_ID !== null && data.branches) {
      return data.branches.filter(b => Number(b.Bank_ID) === Number(employee.Bank_ID));
    }
    return [];
  });

  const posts = data.posts || [];
  const selections = data.userPostSelections?.[currentUser.User_ID] || [];
  const availablePosts = currentUser.User_Type === UserType.ADMIN 
    ? posts 
    : posts.filter(p => selections.includes(p.Post_ID));

  useEffect(() => {
    if (typeof formData.Department_ID === 'number' && data.offices) {
      setAvailableOffices(data.offices.filter(o => Number(o.Department_ID) === Number(formData.Department_ID)));
    }
  }, [formData.Department_ID, data.offices]);

  useEffect(() => {
    if (typeof formData.Bank_ID === 'number' && data.branches) {
      setAvailableBranches(data.branches.filter(b => Number(b.Bank_ID) === Number(formData.Bank_ID)));
    }
  }, [formData.Bank_ID, data.branches]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const idValue = Number(formData.Employee_ID);
    
    if (!formData.Employee_ID) newErrors.Employee_ID = "Required";
    if (!formData.Employee_Name?.trim()) newErrors.Employee_Name = "Required";
    if (!formData.Employee_Surname?.trim()) newErrors.Employee_Surname = "Required";
    if (!formData.Mobile || !/^[0-9]{10}$/.test(formData.Mobile)) newErrors.Mobile = "Valid 10-digit mobile required";
    if (!formData.ACC_No) newErrors.ACC_No = "Required";
    if (!formData.Bank_ID) newErrors.Bank_ID = "Required";
    if (!formData.Branch_ID) newErrors.Branch_ID = "Required";
    if (!formData.IFSC_Code) newErrors.IFSC_Code = "Required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIfscVerify = async () => {
    const ifsc = formData.IFSC_Code?.trim();
    if (!ifsc || ifsc.length !== 11) return alert('Enter a valid 11-digit IFSC');
    
    setIsVerifyingIfsc(true);
    const details = await ifscService.fetchDetails(ifsc);
    setIsVerifyingIfsc(false);
    
    if (details) {
      alert(`Web Record Found:\nBank: ${details.BANK}\nBranch: ${details.BRANCH}\n\nPlease ensure you have selected the matching local bank and branch from the dropdowns.`);
    } else {
      alert('IFSC could not be verified on the web.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(formData as Employee);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    
    if (name.includes('ID') || name === 'Employee_ID') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    if (name === 'Bank_ID') {
      setFormData(prev => ({ ...prev, [name]: finalValue, Branch_ID: '' as any, IFSC_Code: '' }));
      return;
    }

    if (name === 'Branch_ID') {
      const branch = (data.branches || []).find(b => Number(b.Branch_ID) === Number(finalValue));
      setFormData(prev => ({ ...prev, [name]: finalValue, IFSC_Code: branch ? branch.IFSC_Code : '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  return (
    <div className="card shadow border-0 p-4 p-md-5">
      <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
        <div>
          <h2 className="fw-bold h4 mb-1">{employee ? 'Modify Record' : 'Employee Registration'}</h2>
          <p className="text-muted small mb-0">Complete all mandatory fields (*)</p>
        </div>
        <button onClick={onCancel} className="btn btn-outline-secondary btn-sm rounded-pill px-3"><X size={16} /> Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="row g-4">
        <div className="col-12 mt-0">
          <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold border-start border-4 border-primary ps-3">
            <UserIcon size={18} /> Personal Information
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-bold">Employee ID *</label>
          <input name="Employee_ID" value={formData.Employee_ID ?? ''} onChange={handleChange} readOnly={!!employee} className={`form-control bg-light ${errors.Employee_ID ? 'is-invalid' : ''}`} />
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-bold">First Name *</label>
          <input name="Employee_Name" value={formData.Employee_Name || ''} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">Surname *</label>
          <input name="Employee_Surname" value={formData.Employee_Surname || ''} onChange={handleChange} className="form-control" />
        </div>
        
        <div className="col-md-4">
          <label className="form-label small fw-bold">DOB *</label>
          <input type="date" name="DOB" value={formData.DOB || ''} onChange={handleChange} className="form-control" />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">Mobile *</label>
          <input name="Mobile" value={formData.Mobile || ''} onChange={handleChange} className="form-control" maxLength={10} />
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">EPIC No. *</label>
          <input name="EPIC" value={formData.EPIC || ''} onChange={handleChange} className="form-control" />
        </div>

        <div className="col-12 mt-5">
          <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold border-start border-4 border-primary ps-3">
            <Briefcase size={18} /> Employment Details
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-bold">Department *</label>
          <select name="Department_ID" value={formData.Department_ID ?? ''} onChange={handleChange} className="form-select">
            <option value="">Choose Dept</option>
            {data.departments.map(d => <option key={d.Department_ID} value={d.Department_ID}>{d.Department_Name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">Office *</label>
          <select name="Office_ID" value={formData.Office_ID ?? ''} onChange={handleChange} className="form-select">
            <option value="">Choose Office</option>
            {availableOffices.map(o => <option key={o.Office_ID} value={o.Office_ID}>{o.Office_Name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">Post *</label>
          <select name="Post_ID" value={formData.Post_ID ?? ''} onChange={handleChange} className="form-select">
            <option value="">Choose Post</option>
            {availablePosts.map(p => <option key={p.Post_ID} value={p.Post_ID}>{p.Post_Name}</option>)}
          </select>
        </div>

        <div className="col-12 mt-5">
          <div className="d-flex align-items-center gap-2 mb-3 text-primary fw-bold border-start border-4 border-primary ps-3">
            <Landmark size={18} /> Payment & Banking
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label small fw-bold">Bank Name *</label>
          <select name="Bank_ID" value={formData.Bank_ID ?? ''} onChange={handleChange} className="form-select">
            <option value="">Select Bank</option>
            {data.banks.map(b => <option key={b.Bank_ID} value={b.Bank_ID}>{b.Bank_Name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">Branch *</label>
          <select name="Branch_ID" value={formData.Branch_ID ?? ''} onChange={handleChange} className="form-select">
            <option value="">Select Branch</option>
            {availableBranches.map(b => <option key={b.Branch_ID} value={b.Branch_ID}>{b.Branch_Name}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-bold">IFSC Code (Verify on Web)</label>
          <div className="input-group">
            <input name="IFSC_Code" value={formData.IFSC_Code || ''} onChange={handleChange} className="form-control bg-light" placeholder="e.g. SBIN..." />
            <button type="button" onClick={handleIfscVerify} className="btn btn-outline-primary" disabled={isVerifyingIfsc}>
              {isVerifyingIfsc ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </div>
        <div className="col-md-8">
          <label className="form-label small fw-bold">Account Number *</label>
          <input name="ACC_No" value={formData.ACC_No || ''} onChange={handleChange} className="form-control" />
        </div>

        <div className="col-12 text-end mt-5">
          <button type="button" onClick={onCancel} className="btn btn-light px-4 me-2">Cancel</button>
          <button type="submit" className="btn btn-primary px-5 d-inline-flex align-items-center gap-2 shadow-sm">
            <Save size={18} /> Commit Changes
          </button>
        </div>
      </form>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default EmployeeForm;
