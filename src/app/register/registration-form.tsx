"use client";

import { useState } from "react";
import Link from "next/link";
import { btn, input, label, Card } from "@/components/ui";
import { hashPassword, saveRegisteredStudent, type RegisteredStudent } from "@/lib/accounts";
import { allUrCampuses, urColleges, urProgrammesUrl } from "@/lib/ur-structure";

const fields = [
  ["firstName", "First and middle names", "text"], ["lastName", "Surname", "text"],
  ["registrationNumber", "Student registration number", "text"], ["email", "Personal or university email", "email"],
  ["phone", "Phone number", "tel"],
  ["year", "Current year of study", "text"], ["studyEndDate", "Expected programme end date", "date"],
] as const;

export function StudentRegistrationForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [campus, setCampus] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [programmeName, setProgrammeName] = useState("");
  const [otherSchool, setOtherSchool] = useState("");
  const [otherDepartment, setOtherDepartment] = useState("");
  const [otherProgramme, setOtherProgramme] = useState("");
  const [card, setCard] = useState<{ name: string; data: string }>();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const college = urColleges.find((item) => item.code === collegeCode);
  const school = college?.schools.find((item) => item.name === schoolName);
  const department = school?.departments.find((item) => item.name === departmentName);
  const programmeOptions = department?.programmes ?? (departmentName === "Other / not listed" ? ["Other / not listed"] : []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!card) { setError("Upload a photo or PDF of your current student card."); return; }
    if (!college || !campus || !schoolName || !departmentName || !programmeName) { setError("Choose your campus, college, school, department and programme."); return; }
    if (programmeName === "Other / not listed" && !otherProgramme.trim()) { setError("Enter your programme name."); return; }
    const selectedProgramme = programmeName === "Other / not listed" ? otherProgramme.trim() : programmeName;
    const student: RegisteredStudent = {
      id: crypto.randomUUID(),
      firstName: values.firstName.trim(), lastName: values.lastName.trim(),
      registrationNumber: values.registrationNumber.trim(), email: values.email.trim(),
      passwordHash: await hashPassword(password), phone: values.phone.trim(),
      department: departmentName === "Other / not listed" ? otherDepartment.trim() : departmentName,
      faculty: selectedProgramme,
      school: schoolName === "Other / not listed" ? otherSchool.trim() : schoolName,
      campus, college: `${college.name} (${college.code})`, programme: selectedProgramme,
      year: values.year.trim(), studyEndDate: values.studyEndDate,
      studentCardName: card.name, studentCardData: card.data, votedElectionIds: [],
    };
    const result = saveRegisteredStudent(student);
    if (result) { setError(result); return; }
    setSaved(true);
  }

  async function onCard(file?: File) {
    if (!file) return;
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      setError("Use a JPG, PNG, WebP or PDF file up to 2 MB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => setCard({ name: file.name, data: String(reader.result) });
    reader.readAsDataURL(file);
    setError("");
  }

  if (saved) return <Card className="mt-6 border-emerald-200 bg-emerald-50 p-5"><h2 className="font-semibold text-emerald-900">Account created</h2><p className="mt-2 text-sm text-emerald-800">Your account is ready. Sign in with your email or registration number and the password you created.</p><Link className={`${btn.primary} mt-4`} href="/login">Sign in</Link></Card>;

  return <form onSubmit={submit} className="mt-6 space-y-6">
    <Card className="p-5 sm:p-6"><h2 className="font-semibold">Personal and account details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
      {fields.slice(0, 5).map(([key, title, type]) => <div key={key}><label className={label} htmlFor={key}>{title}</label><input id={key} type={type} className={input} value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} required /></div>)}
      <div><label className={label} htmlFor="password">Create password</label><input id="password" type="password" minLength={10} autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} required /><p className="mt-1 text-xs text-slate-500">Use at least 10 characters.</p></div>
    </div></Card>
    <Card className="p-5 sm:p-6"><h2 className="font-semibold">University and academic details</h2><p className="mt-1 text-sm text-slate-600">Select your location in order. Later choices update to match the college and school you select.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><label className={label} htmlFor="campus">Campus</label><select id="campus" className={input} value={campus} onChange={(e) => setCampus(e.target.value)} required><option value="">Select a campus</option>{allUrCampuses.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div><label className={label} htmlFor="college">College</label><select id="college" className={input} value={collegeCode} onChange={(e) => { const next = urColleges.find((item) => item.code === e.target.value); setCollegeCode(e.target.value); if (!campus && next) setCampus(next.primaryCampus); setSchoolName(""); setDepartmentName(""); setProgrammeName(""); }} required><option value="">Select a college</option>{urColleges.map((item) => <option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}</select></div>
      {college && <div className="sm:col-span-2 rounded-xl border border-sky-100 bg-sky-50 p-4"><p className="font-medium text-sky-950">{college.name} ({college.code})</p><p className="mt-1 text-sm text-slate-700">Main campus: {college.primaryCampus} <span aria-hidden="true">·</span> <a className="text-sky-800 underline underline-offset-2" href={`mailto:${college.email}`}>{college.email}</a></p><a className="mt-1 inline-block text-sm text-sky-800 underline underline-offset-2" href={college.website} target="_blank" rel="noreferrer">Visit official college website</a></div>}
      <div><label className={label} htmlFor="school">School</label><select id="school" className={input} value={schoolName} onChange={(e) => { setSchoolName(e.target.value); setDepartmentName(""); setProgrammeName(""); }} disabled={!college} required><option value="">Select a school</option>{college?.schools.map((item) => <option key={item.name}>{item.name}</option>)}<option>Other / not listed</option></select>{schoolName === "Other / not listed" && <input className={`${input} mt-2`} aria-label="Enter school name" placeholder="Enter your school" value={otherSchool} onChange={(e) => setOtherSchool(e.target.value)} required />}</div>
      <div><label className={label} htmlFor="department">Department</label><select id="department" className={input} value={departmentName} onChange={(e) => { setDepartmentName(e.target.value); setProgrammeName(""); }} disabled={!school && schoolName !== "Other / not listed"} required><option value="">Select a department</option>{school?.departments.map((item) => <option key={item.name}>{item.name}</option>)}<option>Other / not listed</option></select>{departmentName === "Other / not listed" && <input className={`${input} mt-2`} aria-label="Enter department name" placeholder="Enter your department" value={otherDepartment} onChange={(e) => setOtherDepartment(e.target.value)} required />}</div>
      <div><label className={label} htmlFor="programme">Programme</label><select id="programme" className={input} value={programmeName} onChange={(e) => setProgrammeName(e.target.value)} disabled={!programmeOptions.length} required><option value="">Select your programme</option>{programmeOptions.map((item) => <option key={item}>{item}</option>)}{!programmeOptions.includes("Other / not listed") && <option>Other / not listed</option>}</select>{programmeName === "Other / not listed" && <input className={`${input} mt-2`} aria-label="Enter programme name" placeholder="Enter your programme as shown on your student record" value={otherProgramme} onChange={(e) => setOtherProgramme(e.target.value)} required />}<a className="mt-2 inline-block text-sm text-sky-800 underline underline-offset-2" href={urProgrammesUrl} target="_blank" rel="noreferrer">Browse the official UR programme directory</a></div>
      {fields.slice(5).map(([key, title, type]) => <div key={key}><label className={label} htmlFor={key}>{title}</label><input id={key} type={type} className={input} value={values[key] ?? ""} onChange={(e) => setValues({ ...values, [key]: e.target.value })} required /></div>)}
    </div><p className="mt-3 text-xs text-slate-500">Use the academic details shown on your student record. Eligibility for each election depends on its published rules and your expected programme end date.</p></Card>
    <Card className="p-5 sm:p-6"><h2 className="font-semibold">Student card</h2><p className="mt-1 text-sm text-slate-600">Upload a clear, current student card image or PDF. Maximum 2 MB in this demo.</p><input className="mt-4 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onCard(e.target.files?.[0])} required />{card && <p className="mt-2 text-sm text-emerald-700">Selected: {card.name}</p>}</Card>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex justify-end"><button className={btn.primary} type="submit">Submit registration</button></div>
    <p className="text-xs leading-relaxed text-slate-500">This demo stores account and document data in this browser only. Connect the backend before collecting real student information.</p>
  </form>;
}
