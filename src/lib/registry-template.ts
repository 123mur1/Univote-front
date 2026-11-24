import { strToU8, zipSync } from "fflate";
import { allUrCampuses, urColleges } from "./ur-structure";

const xml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const excelColumn = (index: number) => {
  let number = index + 1;
  let name = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
};

export function makeRegistryTemplate() {
  const colleges = urColleges.map((college) => college.name).sort();
  const headers = ["Registration Number", "Names", "Campus", "College", "School", "Department", "Year of Study", "Cumulative GPA", "Open Disciplinary Case"];
  const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const headerCells = headers.map((value, index) => `<c r="${columns[index]}1" t="inlineStr"><is><t>${xml(value)}</t></is></c>`).join("");
  const validations = [
    ["C", "=CAMPUS_CHOICES"], ["D", "=COLLEGE_CHOICES"],
    ["E", '=INDIRECT("SCHOOLS_"&VLOOKUP($D2,COLLEGE_CODE_MAP,2,FALSE))'],
    ["F", '=INDIRECT("DEPARTMENTS_"&VLOOKUP($E2,SCHOOL_CODE_MAP,2,FALSE))'],
    ["G", "=STUDY_YEAR_CHOICES"],
  ].map(([column, formula]) => `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Choose a listed value" error="Select the college or school first, then choose from this dropdown." sqref="${column}2:${column}1000"><formula1>${xml(formula)}</formula1></dataValidation>`).join("");
  const studentSheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:G2"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="2" width="32" customWidth="1"/><col min="3" max="6" width="36" customWidth="1"/><col min="7" max="7" width="18" customWidth="1"/></cols><sheetData><row r="1">${headerCells}</row><row r="2">${columns.map((column) => `<c r="${column}2" t="inlineStr"><is><t></t></is></c>`).join("")}</row></sheetData><autoFilter ref="A1:G1000"/><dataValidations count="5">${validations}</dataValidations></worksheet>`;
  const lists: string[][] = [allUrCampuses, colleges, ["1", "2", "3", "4", "5"]];
  const names: string[] = [
    `<definedName name="CAMPUS_CHOICES">'Lists'!$A$1:$A$${allUrCampuses.length}</definedName>`,
    `<definedName name="COLLEGE_CHOICES">'Lists'!$B$1:$B$${colleges.length}</definedName>`,
    `<definedName name="STUDY_YEAR_CHOICES">'Lists'!$C$1:$C$5</definedName>`,
  ];
  const collegeMap: string[][] = [];
  const schoolDepartmentMap = new Map<string, { name: string; departments: Set<string> }>();
  const safeKey = (value: string) => value.normalize("NFKD").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  for (const college of urColleges) {
    const key = college.code;
    const schoolNames = [...new Set(college.schools.map((school) => school.name))].sort();
    const columnIndex = lists.length;
    lists.push(schoolNames);
    const column = excelColumn(columnIndex);
    names.push(`<definedName name="SCHOOLS_${key}">'Lists'!$${column}$1:$${column}$${schoolNames.length}</definedName>`);
    collegeMap.push([college.name, key]);
    for (const school of college.schools) {
      const schoolKey = safeKey(school.name);
      const entry = schoolDepartmentMap.get(schoolKey) ?? { name: school.name, departments: new Set<string>() };
      school.departments.forEach((department) => entry.departments.add(department.name));
      schoolDepartmentMap.set(schoolKey, entry);
    }
  }
  const collegeMapStart = lists.length;
  lists.push(collegeMap.map((row) => row[0]), collegeMap.map((row) => row[1]));
  const collegeMapStartColumn = excelColumn(collegeMapStart);
  const collegeCodeColumn = excelColumn(collegeMapStart + 1);
  names.push(`<definedName name="COLLEGE_CODE_MAP">'Lists'!$${collegeMapStartColumn}$1:$${collegeCodeColumn}$${collegeMap.length}</definedName>`);
  const schoolEntries = [...schoolDepartmentMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const schoolMapStart = lists.length;
  lists.push(schoolEntries.map((entry) => entry.name), schoolEntries.map((entry) => safeKey(entry.name)));
  const schoolNameColumn = excelColumn(schoolMapStart);
  const schoolKeyColumn = excelColumn(schoolMapStart + 1);
  names.push(`<definedName name="SCHOOL_CODE_MAP">'Lists'!$${schoolNameColumn}$1:$${schoolKeyColumn}$${schoolEntries.length}</definedName>`);
  for (const entry of schoolEntries) {
    const departments = [...entry.departments].sort();
    const columnIndex = lists.length;
    lists.push(departments);
    const column = excelColumn(columnIndex);
    names.push(`<definedName name="DEPARTMENTS_${safeKey(entry.name)}">'Lists'!$${column}$1:$${column}$${departments.length}</definedName>`);
  }
  const listRows = Array.from({ length: Math.max(...lists.map((values) => values.length)) }, (_, row) => `<row r="${row + 1}">${lists.map((values, col) => values[row] ? `<c r="${excelColumn(col)}${row + 1}" t="inlineStr"><is><t>${xml(values[row])}</t></is></c>` : "").join("")}</row>`).join("");
  const listsSheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${listRows}</sheetData></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Students" sheetId="1" r:id="rId1"/><sheet name="Lists" sheetId="2" state="hidden" r:id="rId2"/></sheets><definedNames>${names.join("")}</definedNames><calcPr calcId="191029"/></workbook>`;
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(workbook),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>`),
    "xl/worksheets/sheet1.xml": strToU8(studentSheet),
    "xl/worksheets/sheet2.xml": strToU8(listsSheet),
  };
  return zipSync(files);
}
