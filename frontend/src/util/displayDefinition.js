export default function displayDefinition(st) {
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
    Checkpoint:
      'A checkpoint can be a barrier, or a manned entrance, where drivers are subjected to a security check, often by law enforcement. For example, a checkpoint could be where police set up roadblocks so they can stop and inspect all (or almost all) drivers and vehicles that pass through.',
    'Other Motor Vehicle Violation':
      'If the stop falls within this category, the officer may have stopped an individual for some other violation not listed within the above/below categories',
    Investigation:
      'An investigation is a systematic, thorough attempt to learn the facts about a potential case/crime. An investigation is the process in which law enforcement may go about gathering more information about the case in question. For example, a car may be stopped during an investigation if the police are looking for a suspect to a crime, and the car matches the description of the suspect in question.',
    'Seat Belt Violation':
      'Under NC law, each occupant of a vehicle is required to be fastened by a seat belt when it is in motion. A seatbelt violation is when one or more occupant of a vehicle is not properly wearing a seatbelt while the vehicle is in motion.',
    'Vehicle Regulatory Violation':
      'A vehicle regulatory violation is a violation of regulatory laws regarding motor vehicles. For example, this could look like having expired license plates, an expired tag, or driving without a license.',
    'Vehicle Equipment Violation':
      'A vehicle equipment violation is considered a non-moving violation, and often refers to faulty equipment in a vehicle. Improper equipment may describe a vehicle having equipment or mechanical problems such as dangerous tires, improper muffler, or a broken speedometer. Some other common vehicle equipment violations people might be stopped for are broken/inoperable lights, tinted windows that are too dark, cracked windshield wipers.',
    'Safe Movement Violation':
      'A safe movement violation in North Carolina is a violation of safe movement practices while driving. This can apply to many unsafe driving practices, such as unsafe lane changes or improper turns.',
    'Driving While Impaired':
      'If someone is stopped for suspicion of driving while impaired, the officer may claim to have reason to believe that the person is operating the car while under the influence of any impairing substance, such as alcohol or drugs.',
    'Stop Light/Sign Violation':
      'Someone may be stopped for this kind of violation, for example, by failing to stop completely at a stop sign, by running a red light, or by disregarding a particular road sign.',
    'Speed Limit Violation':
      'A speed limit violation is when an individual is stopped for driving faster than the posted speed limit in a given area, and on a given road. Someone may be stopped for this kind of violation if an officer suspects them of driving over the posted speed limit, or too fast for the current road conditions.',
  }[st];
}
