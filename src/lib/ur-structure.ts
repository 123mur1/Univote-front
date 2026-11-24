// Seeded from the University of Rwanda's published college directory and college sites.
// Keep this data centralized so it can later be replaced by the registrar's live directory.
export type Department = { name: string; programmes: string[] };
export type School = { name: string; departments: Department[] };
export type College = {
  name: string;
  code: string;
  campuses: string[];
  primaryCampus: string;
  email: string;
  website: string;
  schools: School[];
};

const dept = (name: string, ...programmes: string[]): Department => ({
  name,
  programmes: programmes.length ? programmes : ["Other / not listed"],
});

export const urColleges: College[] = [
  {
    name: "College of Agriculture, Forestry and Food Science", code: "CAFF", campuses: ["Busogo"], primaryCampus: "Busogo", email: "info.caff@ur.ac.rw", website: "https://caff.ur.ac.rw/",
    schools: [
      { name: "School of Agricultural Engineering", departments: [dept("Agricultural Engineering", "Agricultural Mechanization", "Irrigation and Drainage")] },
      { name: "School of Agriculture and Food Sciences", departments: [dept("Agriculture", "Crop Production", "Soil Sciences", "Rural Development and Agricultural Economics"), dept("Food Science and Technology")] },
      { name: "School of Forestry, Ecotourism and Greenspace Management", departments: [dept("Forestry and Nature Conservation", "Forestry", "Ecotourism", "Greenspace Management")] },
    ],
  },
  {
    name: "College of Arts and Social Sciences", code: "CASS", campuses: ["Huye", "Gikondo"], primaryCampus: "Huye", email: "info.cass@ur.ac.rw", website: "https://cass.ur.ac.rw/",
    schools: [
      { name: "School of Arts and Languages", departments: [dept("Modern Languages", "Linguistics and Literature", "Translation and Interpreting", "Arts and Publishing", "Arts and Creative Industry")] },
      { name: "School of Journalism and Communication", departments: [dept("Journalism and Communication", "Journalism", "Communication", "Creative Design")] },
      { name: "School of Governance", departments: [dept("Governance and Public Administration"), dept("Development Studies"), dept("History and Heritage Studies"), dept("Political Science and International Relations"), dept("Social Sciences"), dept("Social and Military Sciences"), dept("Professional Police Studies")] },
      { name: "School of Law", departments: [dept("Public Law"), dept("Private Law")] },
    ],
  },
  {
    name: "College of Business and Economics", code: "CBE", campuses: ["Huye", "Gikondo"], primaryCampus: "Huye", email: "info.cbe@ur.ac.rw", website: "https://cbe.ur.ac.rw/",
    schools: [
      { name: "School of Business", departments: [dept("Business Information Technology"), dept("Accounting"), dept("Procurement, Logistics and Transport Management"), dept("Banking and Insurance"), dept("Marketing and Human Resources"), dept("Finance")] },
      { name: "School of Economics", departments: [dept("Applied Statistics"), dept("Economics")] },
    ],
  },
  {
    name: "College of Education", code: "CE", campuses: ["Rukara"], primaryCampus: "Rukara", email: "info.ce@ur.ac.rw", website: "https://ce.ur.ac.rw/",
    schools: [
      { name: "School of Educational Sciences", departments: [dept("Foundations of Education and Curriculum Studies"), dept("Early Childhood and Special Education")] },
      { name: "School of Languages and Social Sciences Education", departments: [dept("Languages Education"), dept("Social Sciences Education")] },
      { name: "School of Mathematics and Science Education", departments: [dept("Mathematics and Computer Science Education"), dept("Science Education"), dept("Physical Education and Sports")] },
      { name: "School of Inclusive and Special Needs Education", departments: [dept("Inclusive and Special Needs Education", "Inclusive Education", "Special Needs Education")] },
    ],
  },
  {
    name: "College of Medicine and Health Sciences", code: "CMHS", campuses: ["Remera", "Huye"], primaryCampus: "Remera", email: "info.cmhs@ur.ac.rw", website: "https://cmhs.ur.ac.rw/",
    schools: [
      { name: "School of Dentistry", departments: [dept("Restorative and Prosthetics", "Dental Surgery", "Dental Therapy")] },
      { name: "School of Health Sciences", departments: [dept("Medical Imaging Sciences"), dept("Clinical Medicine and Community Health"), dept("Physiotherapy"), dept("Prosthetics and Orthotics"), dept("Biomedical Laboratory Sciences"), dept("Anesthesia")] },
      { name: "School of Medicine and Pharmacy", departments: [dept("General Medicine", "Medicine", "Clinical Psychology"), dept("Pharmacy")] },
      { name: "School of Nursing and Midwifery", departments: [dept("Nursing", "General Nursing", "Mental Health Nursing"), dept("Midwifery")] },
      { name: "School of Public Health", departments: [dept("Human Nutrition and Dietetics"), dept("Environmental Health Sciences"), dept("Public Health", "Epidemiology", "Health Policy and Health Economics")] },
    ],
  },
  {
    name: "College of Science and Technology", code: "CST", campuses: ["Nyarugenge", "Huye", "Nyagatare"], primaryCampus: "Nyarugenge", email: "info.cst@ur.ac.rw", website: "https://cst.ur.ac.rw/",
    schools: [
      { name: "School of Architecture and Built Environment", departments: [dept("Architecture"), dept("Construction Management"), dept("Estate Management and Valuation"), dept("Geography and Urban Planning")] },
      { name: "School of Engineering", departments: [dept("Civil Engineering"), dept("Electrical and Electronic Engineering"), dept("Mechanical Engineering")] },
      { name: "School of ICT", departments: [
        dept("Computer and Software Engineering", "BSc (Hons) Computer and Software Engineering", "MSc Software Engineering", "PhD by Research in ICT: Software Engineering"),
        dept("Computer Science", "BSc (Hons) Computer Science", "BSc (Hons) Computer Science - Information Security Option"),
        dept("Information Systems", "BSc (Hons) Information Systems", "MSc Information Systems - e-Government", "MSc Information Systems - Internet Technology"),
        dept("Information Technology", "BSc (Hons) Information Technology", "MSc ICT"),
      ] },
      { name: "School of Mining and Geology", departments: [dept("Mining Engineering"), dept("Geology and Applied Geology")] },
      { name: "School of Science", departments: [dept("Biology"), dept("Chemistry"), dept("Mathematics"), dept("Physics")] },
    ],
  },
  {
    name: "College of Veterinary Medicine and Animal Sciences", code: "CVAS", campuses: ["Nyagatare"], primaryCampus: "Nyagatare", email: "info.cvas@ur.ac.rw", website: "https://cvas.ur.ac.rw/",
    schools: [
      { name: "School of Veterinary Medicine and Life Sciences", departments: [dept("Veterinary Medicine", "Bachelor of Veterinary Medicine")] },
      { name: "School of Animal Sciences and Biotechnology", departments: [dept("Animal Production", "BSc Animal Production"), dept("Aquaculture and Fisheries Management", "BSc Aquaculture and Fisheries Management")] },
      { name: "Other / confirm with College Registrar", departments: [dept("Other / not listed")] },
    ],
  },
];

// The UR programme portal describes eight campuses. Headquarters is omitted because it is not an academic campus.
export const allUrCampuses = ["Busogo", "Gikondo", "Huye", "Nyagatare", "Nyarugenge", "Remera", "Rukara", "Rwamagana"];
export const urProgrammesUrl = "https://programs.ur.ac.rw/academic-programs";
