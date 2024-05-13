from django.db.models import IntegerChoices


class StopPurpose(IntegerChoices):
    # Safety Violation
    SPEED_LIMIT_VIOLATION = 1, "Speed Limit Violation"
    STOP_LIGHT_SIGN_VIOLATION = 2, "Stop Light/Sign Violation"
    DRIVING_WHILE_IMPAIRED = 3, "Driving While Impaired"
    SAFE_MOVEMENT_VIOLATION = 4, "Safe Movement Violation"
    # Regulatory and Equipment
    VEHICLE_EQUIPMENT_VIOLATION = 5, "Vehicle Equipment Violation"
    VEHICLE_REGULATORY_VIOLATION = 6, "Vehicle Regulatory Violation"
    OTHER_MOTOR_VEHICLE_VIOLATION = 9, "Other Motor Vehicle Violation"
    SEAT_BELT_VIOLATION = 7, "Seat Belt Violation"
    # Other
    INVESTIGATION = 8, "Investigation"  # Other
    CHECKPOINT = 10, "Checkpoint"  # Other

    @classmethod
    def get_by_label(cls, label):
        if label:
            for purpose in cls:
                if purpose.label == label:
                    return purpose


CONTRABAND_TYPE_COLS = {
    "Alcohol": "alcohol",
    "Drugs": "drugs",
    "Money": "money",
    "Other": "other",
    "Weapons": "weapons",
}

DEFAULT_RENAME_COLUMNS = {
    "White": "white",
    "Black": "black",
    "Hispanic": "hispanic",
    "Asian": "asian",
    "Native American": "native_american",
    "Other": "other",
}
