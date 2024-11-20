import React from "react";
import "./FacilityBooking.css";

interface FacilityBookingProps {
  facilities: any[];
}

const FacilityBooking: React.FC<FacilityBookingProps> = ({ facilities }) => {
  return (
    <div className="facility-booking">
      <h3>Facilities</h3>
      <div className="facility-list">
        {facilities.map((facility, index) => (
          <div key={index} className="facility-card">
            <p>Name: {facility.name}</p>
            <button className="book-button">Manage Booking</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FacilityBooking;
