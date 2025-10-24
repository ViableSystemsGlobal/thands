
import React from 'react';
import { Link } from 'react-router-dom';

const NavLogo = () => {
  return (
    <Link to="/" className="flex items-center space-x-3">
      <img 
        src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/23de51b1b9990a050321cf95e591c30f.png"
        alt="Tailored Hands Logo"
        className="h-12"
      />
    </Link>
  );
};

export default NavLogo;
