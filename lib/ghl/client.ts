const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

/**
 * Thin GHL API wrapper. Used by sync routes + composite endpoints
 * when dashboard needs to pull appointment data from GHL.
 *
 * Server-side only. Holds the API token.
 */
export class GHLClient {
  private token: string;
  private locationId: string;

  constructor() {
    if (!process.env.GHL_API_TOKEN) throw new Error('GHL_API_TOKEN not set');
    if (!process.env.GHL_LOCATION_ID) throw new Error('GHL_LOCATION_ID not set');
    this.token = process.env.GHL_API_TOKEN;
    this.locationId = process.env.GHL_LOCATION_ID;
  }

  private async request(path: string, init?: RequestInit) {
    const res = await fetch(`${GHL_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });
    if (!res.ok) {
      throw new Error(`GHL ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  getContact(contactId: string) {
    return this.request(`/contacts/${contactId}`);
  }

  getAppointments(contactId: string) {
    return this.request(
      `/calendars/events/appointments?locationId=${this.locationId}&contactId=${contactId}`
    );
  }

  updateContactCustomFields(contactId: string, customFields: Record<string, unknown>) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({ customFields })
    });
  }
}
