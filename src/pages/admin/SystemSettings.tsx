// src/pages/admin/SystemSettings.tsx

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
  getSystemSettings,
  updateSystemSettings,
  getFacilitiesSettings,
  updateFacilitiesSettings,
} from "../../services/databaseService"; // Import necessary services
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../styles/SystemSettings.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface SystemSettingsType {
  maxAppointmentsPerDay: number;
  enableRegistration: boolean;
  // Add other system settings fields here as needed
}

interface FacilitiesSettingsType {
  maxBookingsPerFacility: number;
  enableFacilityBooking: boolean;
  // Add other facilities settings fields here as needed
}

// Define default settings
const defaultSystemSettings: SystemSettingsType = {
  maxAppointmentsPerDay: 0,
  enableRegistration: false,
};

const defaultFacilitiesSettings: FacilitiesSettingsType = {
  maxBookingsPerFacility: 0,
  enableFacilityBooking: false,
};

const SystemSettings: React.FC = () => {
  const [systemSettings, setSystemSettings] = useState<SystemSettingsType>(
    defaultSystemSettings
  );

  const [facilitiesSettings, setFacilitiesSettings] =
    useState<FacilitiesSettingsType>(defaultFacilitiesSettings);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError("");
      try {
        let fetchedSystemSettings, fetchedFacilitiesSettings;

        try {
          fetchedSystemSettings = await getSystemSettings();
        } catch (error) {
          console.warn("No system settings found, using defaults.");
          fetchedSystemSettings = defaultSystemSettings;
        }

        try {
          fetchedFacilitiesSettings = await getFacilitiesSettings();
        } catch (error) {
          console.warn("No facilities settings found, using defaults.");
          fetchedFacilitiesSettings = defaultFacilitiesSettings;
        }

        setSystemSettings(fetchedSystemSettings);
        setFacilitiesSettings(fetchedFacilitiesSettings);
      } catch (err) {
        setError("Failed to load settings.");
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input changes for both system and facilities settings
  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = event.target;

    // Use type narrowing to safely access the checked property
    const newValue =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : Number(value);

    // Update system settings
    if (name in systemSettings) {
      setSystemSettings((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }

    // Update facilities settings
    if (name in facilitiesSettings) {
      setFacilitiesSettings((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        updateSystemSettings(systemSettings),
        updateFacilitiesSettings(facilitiesSettings),
      ]);
      toast.success("Settings updated successfully!");
    } catch (err) {
      setError("Failed to update settings.");
      console.error("Error updating settings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="system-settings-page">
      <ToastContainer />
      <div className="system-settings-container">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit} className="settings-form">
            {/* System Settings Section */}
            <section className="settings-section">
              <h2>General Settings</h2>

              <div className="form-group">
                <label htmlFor="maxAppointmentsPerDay">
                  Max Appointments Per Day:
                  <input
                    type="number"
                    id="maxAppointmentsPerDay"
                    name="maxAppointmentsPerDay"
                    value={systemSettings.maxAppointmentsPerDay}
                    onChange={handleChange}
                    min={0}
                    required
                  />
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="enableRegistration">
                  Enable Registration:
                  <input
                    type="checkbox"
                    id="enableRegistration"
                    name="enableRegistration"
                    checked={systemSettings.enableRegistration}
                    onChange={handleChange}
                  />
                </label>
              </div>

              {/* Add more system settings fields here as needed */}
            </section>

            {/* Facilities Settings Section */}
            <section className="settings-section">
              <h2>Facilities Booking Settings</h2>

              <div className="form-group">
                <label htmlFor="maxBookingsPerFacility">
                  Max Bookings Per Facility:
                  <input
                    type="number"
                    id="maxBookingsPerFacility"
                    name="maxBookingsPerFacility"
                    value={facilitiesSettings.maxBookingsPerFacility}
                    onChange={handleChange}
                    min={0}
                    required
                  />
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="enableFacilityBooking">
                  Enable Facility Booking:
                  <input
                    type="checkbox"
                    id="enableFacilityBooking"
                    name="enableFacilityBooking"
                    checked={facilitiesSettings.enableFacilityBooking}
                    onChange={handleChange}
                  />
                </label>
              </div>

              {/* Add more facilities settings fields here as needed */}
            </section>

            {/* Submit Button */}
            <button type="submit" className="save-button">
              Save Settings
            </button>

            {/* Error Message */}
            {error && <p className="error-message">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
