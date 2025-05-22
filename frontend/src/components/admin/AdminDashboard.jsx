import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Container } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaGraduationCap, FaSchool } from 'react-icons/fa';

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    total_counselors: 0,
    total_bed_students: 0,
    total_hed_students: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/admin/dashboard-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) return <div className="text-center mt-5"><h3>Loading dashboard...</h3></div>;
  if (error) return <div className="alert alert-danger mt-3">{error}</div>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <Row>
        {/* Total Students Card */}
        <Col md={6} lg={3} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center">
              <div className="rounded-circle bg-primary p-3 mb-3">
                <FaUsers className="text-white" size={30} />
              </div>
              <Card.Title className="text-center">Total Students</Card.Title>
              <h2 className="mt-2 mb-0">{stats.total_students}</h2>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Total Counselors Card */}
        <Col md={6} lg={3} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center">
              <div className="rounded-circle bg-success p-3 mb-3">
                <FaUserTie className="text-white" size={30} />
              </div>
              <Card.Title className="text-center">Total Counselors</Card.Title>
              <h2 className="mt-2 mb-0">{stats.total_counselors}</h2>
            </Card.Body>
          </Card>
        </Col>
        
        {/* BED Students Card */}
        <Col md={6} lg={3} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center">
              <div className="rounded-circle bg-warning p-3 mb-3">
                <FaSchool className="text-white" size={30} />
              </div>
              <Card.Title className="text-center">BED Students</Card.Title>
              <h2 className="mt-2 mb-0">{stats.total_bed_students}</h2>
            </Card.Body>
          </Card>
        </Col>
        
        {/* HED Students Card */}
        <Col md={6} lg={3} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex flex-column align-items-center">
              <div className="rounded-circle bg-info p-3 mb-3">
                <FaGraduationCap className="text-white" size={30} />
              </div>
              <Card.Title className="text-center">HED Students</Card.Title>
              <h2 className="mt-2 mb-0">{stats.total_hed_students}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* You can add more dashboard content below */}
    </Container>
  );
}

export default AdminDashboard;