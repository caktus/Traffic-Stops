export default function displayDefinition(st) {
  console.log(st);
  return {
    All: '',
    Consent:
      'A consent search is when a law enforcement officer legally searches a vehicle under the consent or approval of the driver, and therefore does not require a warrant. This means that the police can search the person, their belongings, or the vehicle without any evidence of illegal activity as long as they get permission from the individual.',
    'Search Warrant':
      'This data is from incidents where an officer has obtained a search warrant. A search warrant is generally required for law enforcement to search a person, their belongings, or their vehicle under the US Constitution. A search warrant requires a court order approved by a judge in order for the search to lawfully occur. In North Carolina, a law enforcement officer has 48 hours to conduct the search once the warrant has been approved.',
    'Probable Cause':
      'A probable cause search does not require a warrant. This type of search is lawful when the law enforcement agent has probable cause, or a “strong reason” to believe that the vehicle contains contraband or information regarding a crime.',
    'Search Incident to Arrest':
      'Once a person has been arrested, a law enforcement officer is allowed to search the individual for further contraband and evidence which might add to their criminal charges.',
    'Protective Frisk':
      'A protective frisk can be conducted by a law enforcement officer in efforts to find any weapons which could be used against the officer. This can only be done when the officer has reason to believe the stopped individual may be dangerous and holding weapons.',
  }[st];
}
