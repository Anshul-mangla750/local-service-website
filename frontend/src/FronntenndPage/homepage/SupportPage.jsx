import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

function SupportPage() {
  return (
    <>
      <Navbar />
      <div className="container my-5">
        <div className="row">
          <div className="col-12">
            <h1 className="text-center mb-4">Support Center</h1>
            <p className="text-center lead mb-5">
              We're here to help! Find answers to common questions or get in touch with our support team.
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Frequently Asked Questions</h5>
                <p className="card-text">
                  Browse our FAQ section for quick answers to common questions about using ServiceHub.
                </p>
                <button className="btn btn-primary">View FAQs</button>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title">Contact Support</h5>
                <p className="card-text">
                  Need personalized help? Reach out to our support team via email or phone.
                </p>
                <button className="btn btn-success">Contact Us</button>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">How Can We Help?</h5>
                <div className="accordion" id="supportAccordion">
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                        How do I book a service?
                      </button>
                    </h2>
                    <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#supportAccordion">
                      <div className="accordion-body">
                        To book a service, browse our services page, select a provider, and follow the booking instructions.
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                        What if I need to cancel a booking?
                      </button>
                    </h2>
                    <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#supportAccordion">
                      <div className="accordion-body">
                        You can cancel a booking through your account dashboard up to 24 hours before the scheduled time.
                      </div>
                    </div>
                  </div>
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                        How do I become a service provider?
                      </button>
                    </h2>
                    <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#supportAccordion">
                      <div className="accordion-body">
                        Sign up as a provider on our website and complete the verification process to start offering services.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SupportPage;
