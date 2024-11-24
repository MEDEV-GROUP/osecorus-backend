'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RescueMember extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RescueMember.init({
    user_id: DataTypes.UUID,
    rescue_service_id: DataTypes.UUID,
    position: DataTypes.STRING,
    badge_number: DataTypes.STRING,
    is_on_duty: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'RescueMember',
  });
  return RescueMember;
};