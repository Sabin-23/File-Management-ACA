
function initialsFrom(name) {
  if (!name) return null;
  return (
    name
      .trim()
      .split(/\s+/)
      .map((word) => word[0]?.toUpperCase())
      .join('') || null
  );
}
const standardColumns = {
  partial_case: 'partial_case',
  case_number: 'case_number',
  courtCaseNumber: 'court_case_number',
  partyOne: 'plaintiff',
  partyTwo: 'defendant',
  year: 'year',
  createdBy: 'initials',
  advocateId: 'adv_id',
};
const createStandardMapper = (fileType, courtPrefix) => {
  return function (formData, { advocate }) {
    const reference = `ACA +${formData.case_number || ''}/${formData.partial_case || ''}`;
    
    // Dynamically look up inputs based on the fileType (e.g. commercial_0_1, civil_0_1)
    const courtParts = [
      formData[`${fileType}_0_1`],
      formData[`${fileType}_0_2`],
      formData[`${fileType}_0_3`],
    ].filter(Boolean);

    const courtCaseNumber = courtParts.length
      ? `${courtPrefix} ${courtParts.join('/')}`
      : null;

    const year = formData.date_of_hearing
      ? new Date(formData.date_of_hearing).getFullYear()
      : new Date().getFullYear();

    return {
      reference,
      courtCaseNumber,
      partyOne: formData.plaintiff_name || null,
      partyTwo: formData.defendant_name || null,
      year,
      createdBy: initialsFrom(advocate.name),
      advocateId: advocate.id,
    };
  };
};

export const CASE_TABLES = {
  commercial: {
    table: 'commercials',
    columns: { ...standardColumns },
    mapFormToRow: createStandardMapper('commercial', 'RCOM')
  },
  administrative: {
    table: 'administrative',
    columns: { ...standardColumns },
    mapFormToRow: createStandardMapper('administrative', 'RAD')
  },
  civil: {
    table: 'civil',
    columns: { ...standardColumns },
    mapFormToRow: createStandardMapper('civil', 'RC')
  },
  labour: {
    table: 'labour',
    columns: { ...standardColumns },
    mapFormToRow: createStandardMapper('labour', 'RLAB')
  }, 
  arbitration: {
    table: 'arbitration',
    columns: { ...standardColumns },
    mapFormToRow: createStandardMapper('arbistration', 'ARB')
  },
  consultancy: {
    table: 'consultancy',
    columns: { 
      partial_case: 'partial_case',
      case_number: 'case_number',
      assignments: 'assignments',
      individual: 'individual',
      company: 'company',
      year: 'year',
      createdBy: 'initials',
      advocateId: 'adv_id',
    },
    mapFormToRow: function (formData, { advocate }) {
      
      const year = formData.received_on
        ? new Date(formData.received_on).getFullYear()
        : new Date().getFullYear();

      return {
        assignments: formData.case_object_1 || null,
        individual: formData.individual_name || null,
        company: formData.company_name || null,
        year,
        createdBy: initialsFrom(advocate.name),
        advocateId: advocate.id,
      };
    },
  },  
  criminal: {
    table: 'criminal',
    columns: { 
      partial_case: 'partial_case',
      case_number: 'case_number',
      partyOne: 'plaintiff', 
      partyTwo: 'accused',
      plaintiff: 'plaintiff',
      accused: 'accused',
      civil_party: 'civil_party',
      year: 'year',
      createdBy: 'initials',
      advocateId: 'adv_id',
    },
    mapFormToRow: function (formData, { advocate }) {
      
      const year = formData.received_on
        ? new Date(formData.received_on).getFullYear()
        : new Date().getFullYear();

      return {
        partyOne: formData.prosecution || formData.plaintiff_name || null,
        plaintiff: formData.prosecution || null,
        accused: formData.accused_1_name + (formData.accused_2_name ? ` & ${formData.accused_2_name}` : '') || null,
        partyTwo: formData.accused_1_name + (formData.accused_2_name ? ` & ${formData.accused_2_name}` : '') || null,
        civil_party: formData.civil_party_name || null,
        year,
        createdBy: initialsFrom(advocate.name),
        advocateId: advocate.id,
      };
    },
  }, 
};
