import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  getSystemSettings,
  updateSystemSettings,
  getFacilitiesSettings,
  updateFacilitiesSettings,
} from "../../services/databaseService"; // Added facilitiesService methods
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../styles/SystemSettings.css";
import Sidebar from "../../components/Sidebar";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maxAppointmentsPerDay: 0,
    enableRegistration: false,
  });
  const [facilitiesSettings, setFacilitiesSettings] = useState({
    maxBookingsPerFacility: 0,
    enableFacilityBooking: false,
  }); // New state for facilities settings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const fetchedSettings = await getSystemSettings();
        const fetchedFacilitiesSettings = await getFacilitiesSettings(); // Fetch facilities settings
        setSettings(fetchedSettings);
        setFacilitiesSettings(fetchedFacilitiesSettings); // Set facilities settings
      } catch (error) {
        setError("Failed to load settings.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = event.target;
    if (name in settings) {
      setSettings((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } else if (name in facilitiesSettings) {
      setFacilitiesSettings((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    updateSystemSettings(settings)
      .then(() => {
        alert("Settings updated successfully!");
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to update settings.");
        console.error(error);
        setLoading(false);
      });

    updateFacilitiesSettings(facilitiesSettings) // Handle facilities settings update
      .then(() => {
        alert("Facilities settings updated successfully!");
        setLoading(false);
      })
      .catch((error) => {
        setError("Failed to update facilities settings.");
        console.error(error);
        setLoading(false);
      });
  };

  return (
    <div>
      <h1>System Settings</h1>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Max Appointments Per Day:
              <input
                type="number"
                name="maxAppointmentsPerDay"
                value={settings.maxAppointmentsPerDay}
                onChange={handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Enable Registration:
              <input
                type="checkbox"
                name="enableRegistration"
                checked={settings.enableRegistration}
                onChange={handleChange}
              />
            </label>
          </div>

          <div>
            <h2>Facilities Booking Settings</h2>
            <label>
              Max Bookings Per Facility:
              <input
                type="number"
                name="maxBookingsPerFacility"
                value={facilitiesSettings.maxBookingsPerFacility}
                onChange={handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Enable Facility Booking:
              <input
                type="checkbox"
                name="enableFacilityBooking"
                checked={facilitiesSettings.enableFacilityBooking}
                onChange={handleChange}
              />
            </label>
          </div>

          <button type="submit">Save Settings</button>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default SystemSettings;
