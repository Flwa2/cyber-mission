// Station 03 display filenames. Stable evidence/case IDs are never renamed.
export const STATION03_FILENAMES = {
 'Supplier_Payment_Summary.pdf':'Payments_Oct.xlsx',
 'Workstation_Directory.pdf':'Contacts.xlsx',
 'Finance_Print_Cover.pdf':'Project_Update.pdf',
 'Environmental_Project_Status.pdf':'Project_Status.docx',
 'Environmental_Project_Brief.pdf':'Project_Status.docx',
 'Environmental_Initiative_Review.pdf':'Agenda.pdf',
 'Published_Service_Report.pdf':'Agenda.pdf',
 'Environment_Fund_Overview.pdf':'Agenda.pdf',
 'Company_Brochure.pdf':'Agenda.pdf',
 'Desk_Transfer_Register.pdf':'Handover.pdf',
 'Operations_Contact_List.pdf':'Site_Contacts.pdf',
 'Project_Handover.pdf':'Handover_Sept.pdf',
 'Project_Delivery.zip':'Project_Sept.zip',
 'Account_Update.zip':'Update.zip',
 'Account_Session_Export.csv':'Sessions.csv',
 'Session_Export.csv':'Sessions.csv',
 'Sharing_Receipt.pdf':'Receipt_06.pdf',
 'Site_Visit_Draft.pdf':'Visit_Draft.pdf',
 'Workstation_Assignment.pdf':'Devices.pdf',
 'Quarterly_Report_Q3.pdf':'Q3_Update.pdf',
 'Department_Budget.xlsx':'Budget_Q4.xlsx',
 'Employee_Payroll_2026.xlsx':'Payroll_Oct.xlsx',
 'Payroll_Summary.xlsx':'Payroll_Oct.xlsx',
 'Team_Meeting_Notes.docx':'Notes.docx',
 'Meeting_Notes_Draft.docx':'Notes_Draft.docx',
 'Meeting_Draft.docx':'Minutes_Draft.docx',
 'Training_Schedule.pdf':'Training.pdf',
 'Workshop_Schedule.pdf':'Workshop.pdf',
 'Cafeteria_Menu.pdf':'Visit_Draft.pdf',
 'Cafeteria_Menu.png':'Visit_Map.png',
 'Browser_Navigation_Record.json':'Browser.json',
 'nora_Training_Notes.pdf':'Field_Notes.pdf',
 'sami_Training_Notes.pdf':'Procurement.pdf',
 'reem_Training_Notes.pdf':'Invoice_1048.pdf',
 'mazen_Training_Notes.pdf':'Q3_Update.pdf',
 'nora_Project_Review.pdf':'Field_Notes.pdf',
 'sami_Project_Review.pdf':'Procurement.pdf',
 'reem_Project_Review.pdf':'Invoice_1048.pdf',
 'mazen_Project_Review.pdf':'Q3_Update.pdf',
 'nawaf_Project_Review.pdf':'Procurement.pdf',
 'sara_Project_Review.pdf':'Invoice_1048.pdf',
 'khalid_Project_Review.pdf':'Q3_Update.pdf'
};
const pattern=new RegExp(Object.keys(STATION03_FILENAMES).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
export function renameStation03Files(value){
 if(typeof value==='string')return value.replace(pattern,name=>STATION03_FILENAMES[name]);
 if(Array.isArray(value))return value.map(renameStation03Files);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,renameStation03Files(item)]));
 return value;
}
