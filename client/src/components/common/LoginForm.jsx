// ============================================================================
// LoginForm.jsx - Componente Form con useActionState
// ============================================================================

import { useActionState } from "react";
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router';

function LoginForm(props) {
    // Usa useActionState esattamente come l'esempio del prof
    const [state, formAction, isPending] = useActionState(loginFunction, {username: '', password: ''});

    async function loginFunction(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
        };
        
        try {
            await props.handleLogin(credentials);
            return { success: true };
        } catch (error) {
            // Il prof gestisce l'errore qui e lo mostra nel form
            return { error: 'Login fallito. Controlla le tue credenziali.' };
        }
    }

    return (
        <>
            {/* Loading state durante il submit */}
            {isPending && (
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
                            <Form action={formAction}>
                                <Form.Group controlId='username' className='mb-3'>
                                    <Form.Label>
                                        <i className="bi bi-person me-2"></i>
                                        Username
                                    </Form.Label>
                                    <Form.Control 
                                        type='text' 
                                        name='username' 
                                        placeholder="Inserisci il tuo username"
                                        required 
                                        disabled={isPending}
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
                                        placeholder="Inserisci la tua password"
                                        required 
                                        minLength={6}
                                        disabled={isPending}
                                    />
                                </Form.Group>

                                {/* Mostra errore se il login fallisce */}
                                {state.error && (
                                    <Alert variant="danger" className="d-flex align-items-center">
                                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                        {state.error}
                                    </Alert>
                                )}

                                <div className="d-grid gap-2">
                                    <Button 
                                        type='submit' 
                                        variant="primary" 
                                        size="lg"
                                        disabled={isPending}
                                    >
                                        {isPending ? (
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
                                        disabled={isPending}
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