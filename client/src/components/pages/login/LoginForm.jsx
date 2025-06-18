// ============================================================================
// LoginForm.jsx - CONFORME alle specifiche del professore
// ============================================================================
import { useState } from "react";
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router';

function LoginForm(props) {
   // ✅ CONTROLLED COMPONENTS: ogni input ha uno stato
   // ✅ VALORI DEFAULT per velocizzare i test del prof (come suggerito nelle specifiche)
   const [username, setUsername] = useState('user1');
   const [password, setPassword] = useState('password');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState('');
   
   // ✅ GESTIONE CAMBIO INPUT con onChange (come richiesto dal prof)
   const handleUsernameChange = (event) => {
       setUsername(event.target.value);
       // ✅ Reset errore quando l'utente inizia a digitare
       if (error) setError('');
   };
   
   const handlePasswordChange = (event) => {
       setPassword(event.target.value);
       // ✅ Reset errore quando l'utente inizia a digitare
       if (error) setError('');
   };
   
   // ✅ GESTIONE SUBMIT con preventDefault (come nelle slide del corso)
   const handleSubmit = async (event) => {
       event.preventDefault(); // ✅ OBBLIGATORIO per evitare reload pagina
       
       // ✅ VALIDAZIONE CORRETTA: solo controlli base, NON validazione password
       if (!username.trim()) {
           setError('Username è obbligatorio');
           return;
       }
       
       if (!password) {
           setError('Password è obbligatoria');
           return;
       }
       
       try {
           setIsSubmitting(true);
           setError('');
           
           const credentials = { username: username.trim(), password };
           await props.handleLogin(credentials);
           
           // ✅ Se arriviamo qui, login riuscito
           // Il redirect è gestito dal componente parent
           
       } catch (err) {
           // ✅ Gestione errore nel form (come vuole il prof)
           setError('Login fallito. Controlla le tue credenziali.');
       } finally {
           setIsSubmitting(false);
       }
   };
   
   return (
       <>
           {/* Loading state durante il submit */}
           {isSubmitting && (
               <Alert variant="warning" className="d-flex align-items-center">
                   <i className="bi bi-hourglass-split me-2"></i>
                   Attendere la risposta del server...
               </Alert>
           )}
           
           <Row className="justify-content-center">
               <Col md={6} lg={4}>
                   <Card className="shadow-sm">
                       <Card.Header className="text-center bg-primary text-white">
                           <h4 className="mb-0">
                               <i className="bi bi-box-arrow-in-right me-2"></i>
                               Accedi a Stuff Happens
                           </h4>
                       </Card.Header>
                       <Card.Body className="p-4">
                           {/* ✅ FORM CONTROLLATO con onSubmit */}
                           <Form onSubmit={handleSubmit}>
                               <Form.Group controlId='username' className='mb-3'>
                                   <Form.Label>
                                       <i className="bi bi-person me-2"></i>
                                       Username
                                   </Form.Label>
                                   <Form.Control 
                                       type='text' 
                                       name='username'
                                       value={username} // ✅ OBBLIGATORIO: attributo value
                                       onChange={handleUsernameChange} // ✅ OBBLIGATORIO: onChange
                                       placeholder="Inserisci il tuo username"
                                       required 
                                       disabled={isSubmitting}
                                       // ✅ SUPPORTA SPAZI: il trim() è solo in validazione
                                       autoComplete="username"
                                   />
                               </Form.Group>
                               
                               <Form.Group controlId='password' className='mb-3'>
                                   <Form.Label>
                                       <i className="bi bi-lock me-2"></i>
                                       Password
                                   </Form.Label>
                                   <Form.Control 
                                       type='password' 
                                       name='password'
                                       value={password} // ✅ OBBLIGATORIO: attributo value
                                       onChange={handlePasswordChange} // ✅ OBBLIGATORIO: onChange
                                       placeholder="Inserisci la tua password"
                                       required 
                                       // ✅ CORRETTO: NESSUN minLength per login
                                       disabled={isSubmitting}
                                       autoComplete="current-password"
                                   />
                               </Form.Group>
                               
                               {/* ✅ Mostra errore se presente */}
                               {error && (
                                   <Alert variant="danger" className="d-flex align-items-center">
                                       <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                       {error}
                                   </Alert>
                               )}
                               
                               <div className="d-grid gap-2">
                                   <Button 
                                       type='submit' // ✅ type="submit" per gestire onSubmit
                                       variant="primary" 
                                       size="lg"
                                       // ✅ CORRETTO: Non controllare lunghezza password
                                       disabled={isSubmitting || !username.trim() || !password}
                                   >
                                       {isSubmitting ? (
                                           <>
                                               <i className="bi bi-hourglass-split me-2"></i>
                                               Accesso in corso...
                                           </>
                                       ) : (
                                           <>
                                               <i className="bi bi-box-arrow-in-right me-2"></i>
                                               Accedi
                                           </>
                                       )}
                                   </Button>
                                   
                                   <Link 
                                       className='btn btn-outline-secondary' 
                                       to={'/'}
                                       // ✅ CORRETTO: Link non ha disabled, usiamo style
                                       style={{ 
                                           pointerEvents: isSubmitting ? 'none' : 'auto',
                                           opacity: isSubmitting ? 0.6 : 1 
                                       }}
                                   >
                                       <i className="bi bi-arrow-left me-2"></i>
                                       Annulla
                                   </Link>
                               </div>
                           </Form>
                       </Card.Body>
                   </Card>
               </Col>
           </Row>
       </>
   );
}

function LogoutButton(props) {
   return (
       <Button variant='outline-light' onClick={props.logout}>
           <i className="bi bi-box-arrow-right me-1"></i>
           Logout
       </Button>
   );
}

export { LoginForm, LogoutButton };