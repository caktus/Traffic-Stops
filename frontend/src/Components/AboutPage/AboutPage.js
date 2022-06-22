import React, {useState} from 'react';
import * as S from './AboutPage.styled';

import { H1 } from 'styles/StyledComponents/Typography';
import Input from "../Elements/Inputs/Input";
import {Button} from "reaktus";
import axios from "../../Services/Axios";
import {CONTACT_FORM_URL} from "../../Services/endpoints";

function AboutPage(props) {
  const [formFields, setFormFields] = useState({
    name: '',
    nameErrors: [],
    email: '',
    emailErrors: [],
    message: '',
    messageErrors: [],
    messageSent: false
  });

  const setFormValue = (type, value) => {
    setFormFields({
      ...formFields,
      [type]: value,
    });
  };

  const submitMessage = () => {
    let postData = {
      name: formFields.name,
      email: formFields.email,
      message: formFields.message
    }
    console.log(postData);

    axios.post(CONTACT_FORM_URL, postData).then(res => {
      if (res.status === 204) {
        setFormFields({name: '', email: '', message: '', messageSent: true})
        setTimeout(() => {
          setFormFields({messageSent: false});
        }, 2000);
      }
    }).catch(err => {
      if (err.response.data) {
        setFormFields({
          name: formFields.name,
          email: formFields.email,
          message: formFields.message,
          nameErrors: err.response.data["name"],
          emailErrors: err.response.data["email"],
          messageErrors: err.response.data["message"]
        })
      }
    });
  }

  return (
    <S.AboutPageStyled data-testid="AboutPage">
      <S.AboutPageContent>
        <H1>About This Site</H1>
        <S.AboutPageText>
          <S.AboutPageParagraph>
            In the wake of the murders of George Floyd, Breonna Taylor, and countless others whose
            lives were stripped away far too soon at the hands of law enforcement officers, it is
            more important than ever that communities have the tools they need to hold law
            enforcement accountable. As law enforcement officers keep watchful eyes on our
            communities, we too must observe the actions of law enforcement with vigilance, in an
            effort to increase transparency and stop the state sponsored killings of Black and Brown
            people. "The blue wall of silence", and lack of clear reporting and data on officer
            conduct and misconduct, prevents communities from being able to raise alarms and force
            accountability when departments and officers engage in discriminatory behavior that all
            too often turns violent or deadly.
          </S.AboutPageParagraph>
          <S.AboutPageParagraph>
            According to the US Department of Justice, vehicle stops are the number one reason for
            contact between citizens and police. NC CopWatch aims to provide a platform for North
            Carolina community members to have access to law enforcement stop, search, and use of
            force data. The site displays this data in graphs and charts and incorporates features
            that allow the user to compare the traffic stop data to population data, as well as
            review traffic stop data for individual departments over time. NC CopWatch was created
            to serve as a resource to community members, organizers, and advocates across the state
            of North Carolina seeking transparency and accountability in our statewide policing
            practices. The site should operate as an advocacy tool for those seeking policy changes
            in law enforcement practices.
          </S.AboutPageParagraph>
          <S.AboutPageParagraph>
            NC CopWatch presents data collected by the NC State Bureau of Investigation (NC SBI)
            related to all known traffic stops to have occurred in North Carolina since Jan 01,
            2002. Data is available for most North Carolina law enforcement agencies and officers
            serving populations greater than 10,000. North Carolina law requires all such agencies
            to report their data on a monthly basis to the NC Department of Justice; however, some
            datasets are incomplete or remain unreported. Where data sets are incomplete or missing
            from the website it is because they have not been reported to the NC SBI. NC CopWatch
            does not have access to, nor does it publish, the names of officers, drivers, or
            passengers involved in traffic stops.
          </S.AboutPageParagraph>
          <S.AboutPageParagraph>
            NC CopWatch is a project of{' '}
            <a href="https://www.forwardjustice.org" rel="noopener noreferrer" target="_blank">
              Forward Justice
            </a>
            . Forward Justice is a nonpartisan law, policy and strategy center dedicated to
            advancing racial, social, and economic justice in the U.S. South. Our work catalyzes
            success for social movements and expands opportunities for people affected by injustice.
          </S.AboutPageParagraph>
          <S.AboutPageContent>
            Questions about NC CopWatch? Contact us here:
            {formFields.messageSent &&
            <S.AboutPageFlexedDiv>
              <S.AboutPageBoldParagraph>Message sent!</S.AboutPageBoldParagraph>
            </S.AboutPageFlexedDiv>}
            <S.AboutPageParagraph>
              <Input
                label="Your name"
                value={formFields.name}
                errors={formFields.nameErrors}
                onChange={(e) => setFormValue('name', e.target.value)}
              />
              <Input
                  label="Your email"
                  type="email"
                  value={formFields.email}
                  errors={formFields.emailErrors}
                  onChange={(e) => setFormValue('email', e.target.value)}
              />
              <Input
                  label="Message"
                  type="textarea"
                  value={formFields.message}
                  errors={formFields.messageErrors}
                  cols="50"
                  rows="8"
                  onChange={(e) => setFormValue('message', e.target.value)}
              />
              <S.AboutPageFlexedDiv>
                <Button
                  onClick={submitMessage}
                  variant="positive"
                  width="50%"
                  py="2"
                  fontSize="3"
                  fontWeight="bold"
                >
                  SUBMIT
                </Button>
              </S.AboutPageFlexedDiv>
            </S.AboutPageParagraph>
          </S.AboutPageContent>
        </S.AboutPageText>
      </S.AboutPageContent>
    </S.AboutPageStyled>
  );
}

export default AboutPage;
