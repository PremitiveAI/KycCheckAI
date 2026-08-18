from fastapi import Request
from app.models.feature_type_model import FeatureTypeMaster
from app.models.category_type_model import CategoryMaster
from app.services.auth_service import AuthService
from sqlalchemy.orm import Session
class MasterController:

    # ================= FEATURE ================

    @staticmethod
    def save_feature_type(db: Session, payload, request: Request):
        admin_id = request.state.adminUserId

        if payload.id:
            payload.updatedBy = admin_id
            return AuthService.update_master(
                db,
                FeatureTypeMaster,
                payload.dict(),
                admin_id
            )

        payload.createdBy = admin_id
        return AuthService.create_master(
            db,
            FeatureTypeMaster,
            payload.dict(),
            admin_id
        )

    @staticmethod
    def list_feature_types_post(db: Session, payload):
        return AuthService.list_master(
            db,
            FeatureTypeMaster,
            payload.dict()
        )

    @staticmethod
    def get_feature_type(db: Session, id: int):
        return AuthService.get_master_by_id(
            db,
            FeatureTypeMaster,
            id
        )

    @staticmethod
    def delete_feature_type(db: Session, id: int, request: Request):
        admin_id = request.state.adminUserId
        return AuthService.delete_master(
            db,
            FeatureTypeMaster,
            id,
            updatedBy=admin_id
        )

    # ================= CATEGORY =================
    @staticmethod
    def save_category_type(db: Session, payload, request: Request):
        admin_id = request.state.adminUserId

        if payload.id:
            payload.updatedBy = admin_id
            return AuthService.update_master(
                db,
                CategoryMaster,
                payload.dict(),
                admin_id
            )

        payload.createdBy = admin_id
        return AuthService.create_master(
            db,
            CategoryMaster,
            payload.dict(),
            admin_id
        )

    @staticmethod
    def list_category_types_post(db: Session, payload):
        return AuthService.list_master(
            db,
            CategoryMaster,
            payload.dict()
        )

    @staticmethod
    def get_category_type(db: Session, id: int):
        return AuthService.get_master_by_id(
            db,
            CategoryMaster,
            id
        )

    @staticmethod
    def delete_category_type(db: Session, id: int, request: Request):
        admin_id = request.state.adminUserId
        return AuthService.delete_master(
            db,
            CategoryMaster,
            id,
            updatedBy=admin_id
        )