import pytest
from domain.value_objects.email import Email


class TestEmailValueObject:

    def test_valid_email_is_created(self):
        email = Email("user@taskflow.com")
        assert email.value == "user@taskflow.com"

    def test_invalid_email_raises_value_error(self):
        with pytest.raises(ValueError):
            Email("not-an-email")

    def test_email_is_immutable(self):
        email = Email("user@example.com")
        with pytest.raises(Exception):
            email.value = "other@example.com"

    def test_two_equal_emails_are_equal(self):
        assert Email("a@b.com") == Email("a@b.com")
