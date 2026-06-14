from pydantic import BaseModel


class Product(BaseModel):
    id: int
    name: str
    price: float
    category: str
    description: str
    image_emoji: str
