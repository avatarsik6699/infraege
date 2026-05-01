from httpx import AsyncClient


async def test_register_success(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/public/auth/register",
        json={"email": "newuser@example.com", "password": "pass12345", "consent_152fz": True},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]
