def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["platform"] == "AI Mortgage Adviser"


def test_register_and_login(client):
    # Register
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "user@example.com",
            "password": "securepassword123",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "securepassword123"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_get_me(client, auth_headers):
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_time_buyer"] is True


def test_update_mortgage_info(client, auth_headers):
    response = client.patch(
        "/api/v1/users/me/mortgage-info",
        headers=auth_headers,
        json={
            "employment_type": "employed",
            "annual_income": 45000,
            "property_value": 250000,
            "deposit_amount": 25000,
            "first_time_buyer": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["employment_type"] == "employed"
    assert data["annual_income"] == 45000
    assert data["onboarding_completed"] is True


def test_mortgage_calculator(client, auth_headers):
    response = client.post(
        "/api/v1/chat/mortgage-calc",
        headers=auth_headers,
        json={
            "property_value": 250000,
            "deposit": 25000,
            "term_years": 25,
            "interest_rate": 4.5,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ltv_ratio"] == 90.0
    assert data["loan_amount"] == 22500000  # £225,000 in pence
    assert data["monthly_payment"] > 0
    assert data["total_interest"] > 0
    assert data["total_cost"] > 0
    # First-time buyer on £250k: stamp duty should be 0 (under £425k threshold)
    assert data["stamp_duty"] == 0
