import React, {useState} from 'react';
import ClientUsers from './Components/ClientUsers';
import SupportUsers from './Components/SupportUsers';
import Invites from './Components/Invites';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Container from 'react-bootstrap/Container';
import { EngineeringAPI } from '../../api/apiConfig';

const ManageUsersPage = () => {
    const [currentTab, setCurrentTab] = useState('support');


    return (
        <Container className='mt-5'>
           <Tabs activeKey={currentTab} onSelect={(k) => setCurrentTab(k)} className="mb-3" >
                <Tab eventKey="support" title="Support Users">
                    <SupportUsers />
                </Tab>
                <Tab eventKey="client" title="Client Users">
                    <ClientUsers />
                </Tab>
                <Tab eventKey="invites" title="Invited Users">
                    <Invites />
                </Tab>
            </Tabs>
        </Container>
    );
};

export default ManageUsersPage;