import React from 'react';

const EmailTemplate = ({ 
  companyName = "Tailored Hands",
  companyEmail = "contact@tailoredhands.africa", 
  companyPhone = "+233 XX XXX XXXX",
  companyAddress = "Your Business Address",
  subject = "Email Subject",
  content = "Your email content goes here...",
  buttonText = null,
  buttonUrl = null,
  websiteUrl = "https://tailoredhands.africa",
  products = []
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      backgroundColor: '#f4f4f4',
      margin: 0,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#D2B48C',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{companyName}</h1>
          <p style={{ margin: '5px 0 0 0' }}>Modern Elegance Redefined</p>
        </div>
        
        {/* Main Content */}
        <div style={{ padding: '30px' }}>
          <h2 style={{ color: '#D2B48C', marginTop: 0 }}>{subject}</h2>
          
          <div style={{ margin: '20px 0' }}>
            {content}
          </div>

          {/* Products Section */}
          {products && products.length > 0 && (
            <div style={{ margin: '30px 0' }}>
              <h3 style={{ color: '#D2B48C', marginBottom: '20px', textAlign: 'center' }}>Featured Products</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0 auto' }}>
                <tbody>
                  {products.map((product, index) => {
                    const isEven = index % 2 === 0;
                    const isLastRow = index >= products.length - (products.length % 2 === 0 ? 2 : 1);
                    
                    if (isEven) {
                      return (
                        <tr key={product.id || index}>
                          <td style={{ 
                            width: '50%', 
                            padding: '10px', 
                            verticalAlign: 'top',
                            border: 'none'
                          }}>
                            <div style={{
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#ffffff',
                              marginBottom: isLastRow ? '0' : '20px'
                            }}>
                              {product.image_url && (
                                <div style={{ width: '100%', height: '150px', overflow: 'hidden' }}>
                                  <img 
                                    src={product.image_url} 
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              )}
                              <div style={{ padding: '15px' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                  {product.name}
                                </h4>
                                {product.description && (
                                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                                    {product.description.length > 100 
                                      ? `${product.description.substring(0, 100)}...` 
                                      : product.description}
                                  </p>
                                )}
                                {product.price && (
                                  <div style={{ 
                                    fontSize: '18px', 
                                    fontWeight: 'bold', 
                                    color: '#D2B48C',
                                    marginBottom: '10px'
                                  }}>
                                    ${product.price}
                                  </div>
                                )}
                                <a 
                                  href={`${websiteUrl}/products/${product.slug || product.id}`}
                                  style={{
                                    display: 'inline-block',
                                    backgroundColor: '#D2B48C',
                                    color: 'white',
                                    padding: '8px 16px',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  View Product
                                </a>
                              </div>
                            </div>
                          </td>
                          <td style={{ 
                            width: '50%', 
                            padding: '10px', 
                            verticalAlign: 'top',
                            border: 'none'
                          }}>
                            {products[index + 1] ? (
                              <div style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                                marginBottom: isLastRow ? '0' : '20px'
                              }}>
                                {products[index + 1].image_url && (
                                  <div style={{ width: '100%', height: '150px', overflow: 'hidden' }}>
                                    <img 
                                      src={products[index + 1].image_url} 
                                      alt={products[index + 1].name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  </div>
                                )}
                                <div style={{ padding: '15px' }}>
                                  <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>
                                    {products[index + 1].name}
                                  </h4>
                                  {products[index + 1].description && (
                                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                                      {products[index + 1].description.length > 100 
                                        ? `${products[index + 1].description.substring(0, 100)}...` 
                                        : products[index + 1].description}
                                    </p>
                                  )}
                                  {products[index + 1].price && (
                                    <div style={{ 
                                      fontSize: '18px', 
                                      fontWeight: 'bold', 
                                      color: '#D2B48C',
                                      marginBottom: '10px'
                                    }}>
                                      ${products[index + 1].price}
                                    </div>
                                  )}
                                  <a 
                                    href={`${websiteUrl}/products/${products[index + 1].slug || products[index + 1].id}`}
                                    style={{
                                      display: 'inline-block',
                                      backgroundColor: '#D2B48C',
                                      color: 'white',
                                      padding: '8px 16px',
                                      textDecoration: 'none',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    View Product
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div></div>
                            )}
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Call to Action Button */}
          {buttonText && buttonUrl && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <a 
                href={buttonUrl}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#D2B48C',
                  color: 'white',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}
              >
                {buttonText}
              </a>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
          borderTop: '1px solid #e9ecef'
        }}>
          <div style={{ margin: '10px 0' }}>
            <a 
              href={websiteUrl}
              style={{ color: '#D2B48C', textDecoration: 'none', margin: '0 10px' }}
            >
              Visit Our Website
            </a>
            <a 
              href={`mailto:${companyEmail}`}
              style={{ color: '#D2B48C', textDecoration: 'none', margin: '0 10px' }}
            >
              Contact Us
            </a>
          </div>
          <p style={{ margin: '10px 0' }}>
            &copy; {currentYear} {companyName}. All rights reserved.
          </p>
          <p style={{ margin: '10px 0', fontSize: '12px' }}>
            <strong>Contact Information:</strong><br/>
            Email: {companyEmail}<br/>
            Phone: {companyPhone}<br/>
            Address: {companyAddress}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
