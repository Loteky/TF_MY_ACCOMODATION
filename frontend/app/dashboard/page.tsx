'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

type Listing = {
  id: string;
  title: string;
  city: string;
  state: string;
  base: string;
  rent_amount: number;
  rent_currency: string;
  rent_cycle: string;
  status: string;
  owner_id: string;
  exact_address: string;
};

type Interest = {
  id: string;
  message: string;
  status: string;
  interested_officer_id: string;
  created_at: string;
};

type Transfer = {
  id: string;
  status: string;
  to_officer_id: string;
  proposed_move_in: string;
};

export default function DashboardPage() {
  const { officer, logout } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [interests, setInterests] = useState<Record<string, Interest[]>>({});
  const [transfers, setTransfers] = useState<Record<string, Transfer[]>>({});
  const [form, setForm] = useState({
    title: '',
    city: '',
    state: '',
    base: '',
    rent_amount: 0,
    rent_currency: 'NGN',
    rent_cycle: 'monthly',
    bedrooms: 1,
    bathrooms: 1,
    furnished: true,
    amenities: 'Secure parking,Air conditioning',
    exact_address: '',
    available_from: dayjs().format('YYYY-MM-DD'),
    next_rent_due: dayjs().add(1, 'month').format('YYYY-MM-DD'),
    photos: 'https://placeholder.host/quarters.jpg',
  });
  const [alert, setAlert] = useState<string | null>(null);

  const fetchListings = async () => {
    const { data } = await api.get('/listings');
    setListings(data);
  };

  useEffect(() => {
    fetchListings().catch(() => setAlert('Unable to fetch listings at present.'));
  }, []);

  const createListing = async () => {
    try {
      const { data } = await api.post('/listings', {
        ...form,
        rent_amount: Number(form.rent_amount),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        photos: form.photos.split(',').map((value) => value.trim()),
        amenities: form.amenities.split(',').map((value) => value.trim()),
      });
      setAlert('Listing drafted successfully.');
      setForm({
        ...form,
        title: '',
        city: '',
        state: '',
        base: '',
        exact_address: '',
      });
      setListings((prev) => [data, ...prev]);
    } catch (error: any) {
      setAlert(error?.response?.data?.message ?? 'We could not save the listing.');
    }
  };

  const updateStatus = async (listingId: string, status: string) => {
    await api.patch(`/listings/${listingId}/status`, { status });
    await fetchListings();
    setAlert('Listing status updated.');
  };

  const toggleInterests = async (listingId: string) => {
    if (interests[listingId]) {
      setInterests((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
      return;
    }
    const { data } = await api.get(`/interests/listing/${listingId}`);
    setInterests((prev) => ({ ...prev, [listingId]: data }));
  };

  const registerInterest = async (listingId: string) => {
    const message = window.prompt('Message for the owner', 'I should like to take over this property.');
    if (!message) return;
    await api.post('/interests', { listing_id: listingId, message });
    setAlert('Interest submitted. Command staff will review promptly.');
  };

  const updateInterestStatus = async (interestId: string, status: string, listingId: string) => {
    await api.patch(`/interests/${interestId}/status`, { status });
    await toggleInterests(listingId);
    await toggleInterests(listingId);
    setAlert('Interest status recorded.');
  };

  const loadTransfers = async (listingId: string) => {
    const { data } = await api.get(`/transfers/listing/${listingId}`);
    setTransfers((prev) => ({ ...prev, [listingId]: data }));
  };

  const createTransfer = async (listingId: string, toOfficerId: string) => {
    const proposed = window.prompt('Proposed move-in date (YYYY-MM-DD)', dayjs().add(1, 'week').format('YYYY-MM-DD'));
    if (!proposed) return;
    await api.post('/transfers', {
      listing_id: listingId,
      to_officer_id: toOfficerId,
      proposed_move_in: proposed,
    });
    setAlert('Transfer initiated. Awaiting confirmations.');
    await loadTransfers(listingId);
  };

  const approveTransfer = async (transferId: string, listingId: string) => {
    await api.patch(`/transfers/${transferId}/status`, { status: 'approved' });
    setAlert('Transfer approved.');
    await loadTransfers(listingId);
  };

  const personalListings = useMemo(
    () => listings.filter((listing) => listing.owner_id === officer?.id),
    [listings, officer?.id],
  );

  const otherListings = useMemo(
    () => listings.filter((listing) => listing.owner_id !== officer?.id && listing.status === 'published'),
    [listings, officer?.id],
  );

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Welcome, {officer?.full_name}</h1>
          <p>
            Role: <strong>{officer?.role}</strong> · {officer?.official_email}
          </p>
        </div>
        <button onClick={logout} style={{ background: '#c53030' }}>
          Sign out
        </button>
      </div>

      {alert && (
        <div style={{ marginTop: '1rem', background: '#edf5ff', padding: '1rem', borderRadius: '0.75rem' }}>{alert}</div>
      )}

      <section className="card" style={{ marginTop: '2rem' }}>
        <h2>Create a fresh listing</h2>
        <p>All fields are mandatory to uphold audit quality.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          <label>
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            City
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </label>
          <label>
            State
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </label>
          <label>
            Base
            <input value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} required />
          </label>
          <label>
            Rent amount (₦)
            <input
              type="number"
              value={form.rent_amount}
              onChange={(e) => setForm({ ...form, rent_amount: Number(e.target.value) })}
            />
          </label>
          <label>
            Rent cycle
            <select
              value={form.rent_cycle}
              onChange={(e) => setForm({ ...form, rent_cycle: e.target.value })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
          <label>
            Bedrooms
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
            />
          </label>
          <label>
            Bathrooms
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
            />
          </label>
          <label>
            Furnished
            <select
              value={form.furnished ? 'yes' : 'no'}
              onChange={(e) => setForm({ ...form, furnished: e.target.value === 'yes' })}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label>
            Available from
            <input
              type="date"
              value={form.available_from}
              onChange={(e) => setForm({ ...form, available_from: e.target.value })}
            />
          </label>
          <label>
            Next rent due
            <input
              type="date"
              value={form.next_rent_due}
              onChange={(e) => setForm({ ...form, next_rent_due: e.target.value })}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Amenities (comma separated)
            <input value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Exact address (redacted for other officers)
            <input value={form.exact_address} onChange={(e) => setForm({ ...form, exact_address: e.target.value })} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Photo links (comma separated)
            <input value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} />
          </label>
        </div>
        <button style={{ marginTop: '1.5rem' }} onClick={createListing}>
          Save listing draft
        </button>
      </section>

      <section className="card" style={{ marginTop: '2rem' }}>
        <h2>My listings</h2>
        {personalListings.length === 0 ? (
          <p>You have no listings yet.</p>
        ) : (
          personalListings.map((listing) => (
            <div key={listing.id} style={{ borderBottom: '1px solid #eef2f8', padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{listing.title}</h3>
                  <p>
                    {listing.city}, {listing.state} · {listing.base}
                  </p>
                  <span className="badge">{listing.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => updateStatus(listing.id, 'published')}>Publish</button>
                  <button style={{ background: '#22543d' }} onClick={() => toggleInterests(listing.id)}>
                    {interests[listing.id] ? 'Hide interests' : 'View interests'}
                  </button>
                </div>
              </div>
              <p style={{ marginTop: '0.5rem' }}>Exact address: {listing.exact_address}</p>
              {interests[listing.id] && (
                <div style={{ marginTop: '1rem' }}>
                  <h4>Registered interest</h4>
                  {interests[listing.id].length === 0 && <p>No officers have expressed interest yet.</p>}
                  {interests[listing.id].map((interest) => (
                    <div key={interest.id} style={{ border: '1px solid #dbe3f3', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
                      <p>{interest.message}</p>
                      <small>Status: {interest.status}</small>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={() => updateInterestStatus(interest.id, 'accepted', listing.id)}>
                          Accept
                        </button>
                        <button style={{ background: '#c05621' }} onClick={() => updateInterestStatus(interest.id, 'declined', listing.id)}>
                          Decline
                        </button>
                        <button style={{ background: '#553c9a' }} onClick={() => createTransfer(listing.id, interest.interested_officer_id)}>
                          Initiate transfer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1rem' }}>
                <button style={{ background: '#2c5282' }} onClick={() => loadTransfers(listing.id)}>
                  Refresh transfer timeline
                </button>
                {transfers[listing.id] && (
                  <ul>
                    {transfers[listing.id].map((transfer) => (
                      <li key={transfer.id} style={{ marginTop: '0.5rem' }}>
                        Transfer to officer {transfer.to_officer_id} · status {transfer.status}
                        <button
                          style={{ marginLeft: '0.75rem', background: '#38a169' }}
                          onClick={() => approveTransfer(transfer.id, listing.id)}
                        >
                          Mark as approved
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="card" style={{ marginTop: '2rem' }}>
        <h2>Published listings</h2>
        {otherListings.length === 0 ? (
          <p>No available transfers at this moment.</p>
        ) : (
          <div>
            {otherListings.map((listing) => (
              <div key={listing.id} style={{ borderBottom: '1px solid #eef2f8', padding: '1rem 0' }}>
                <h3>{listing.title}</h3>
                <p>
                  {listing.city}, {listing.state} · {listing.base}
                </p>
                <p>{listing.exact_address}</p>
                <button onClick={() => registerInterest(listing.id)}>Register interest</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
